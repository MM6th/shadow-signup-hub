import { useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getWebRTCSession, updateWebRTCSession, WebRTCSession } from '@/integrations/supabase/webrtc-sessions';

interface RTCSessionData {
  sessionId: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidatesOffer?: RTCIceCandidateInit[];
  candidatesAnswer?: RTCIceCandidateInit[];
}

export const useWebRTCStream = (streamId: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  
  const iceCandidates = useRef<RTCIceCandidate[]>([]);

  const initializeWebRTC = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      };
      
      peerConnection.current = new RTCPeerConnection(configuration);
      
      remoteStream.current = new MediaStream();
      
      return true;
    } catch (err: any) {
      console.error('Error initializing WebRTC:', err);
      setError(err.message || 'Failed to initialize WebRTC');
      toast({
        title: "Error",
        description: err.message || 'Failed to initialize WebRTC',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const startStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      if (!peerConnection.current) {
        const initialized = await initializeWebRTC();
        if (!initialized) return null;
      }
      
      localStream.current = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (peerConnection.current && localStream.current) {
        localStream.current.getTracks().forEach(track => {
          if (peerConnection.current && localStream.current) {
            peerConnection.current.addTrack(track, localStream.current);
          }
        });
      }
      
      if (peerConnection.current) {
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            iceCandidates.current.push(event.candidate);
            updateSessionWithCandidate(event.candidate, true);
          }
        };
        
        peerConnection.current.onconnectionstatechange = () => {
          if (peerConnection.current) {
            console.log("Connection state:", peerConnection.current.connectionState);
            if (peerConnection.current.connectionState === 'connected') {
              setIsConnected(true);
            } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.current.connectionState)) {
              setIsConnected(false);
            }
          }
        };
        
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        
        const sessionData: RTCSessionData = {
          sessionId: streamId,
          offer: offer,
          candidatesOffer: []
        };
        
        try {
          await supabase
            .from('webrtc_sessions')
            .upsert({ 
              id: streamId,
              data: sessionData,
              created_at: new Date().toISOString()
            });
        } catch (err) {
          console.error('Error storing session:', err);
        }
          
        const subscription = supabase
          .channel(`webrtc_sessions:id=eq.${streamId}`)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'webrtc_sessions',
            filter: `id=eq.${streamId}`
          }, async (payload) => {
            const sessionData = payload.new.data as RTCSessionData;
            
            if (sessionData.answer && peerConnection.current?.currentRemoteDescription === null) {
              const remoteDesc = new RTCSessionDescription(sessionData.answer);
              await peerConnection.current?.setRemoteDescription(remoteDesc);
              
              if (sessionData.candidatesAnswer && sessionData.candidatesAnswer.length > 0) {
                for (const candidate of sessionData.candidatesAnswer) {
                  await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
                }
              }
            }
            
            if (sessionData.candidatesAnswer && sessionData.candidatesAnswer.length > 0) {
              for (const candidate of sessionData.candidatesAnswer) {
                await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
              }
            }
          })
          .subscribe();
          
        return localStream.current;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error starting WebRTC stream:', err);
      setError(err.message || 'Failed to start stream');
      toast({
        title: "Error",
        description: err.message || 'Failed to start stream',
        variant: "destructive",
      });
      return null;
    }
  }, [initializeWebRTC, streamId, toast]);

  const joinStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      if (!peerConnection.current) {
        const initialized = await initializeWebRTC();
        if (!initialized) return null;
      }
      
      const session = await getWebRTCSession(streamId);
      
      if (!session) throw new Error('Session not found');
      const sessionData = session.data as RTCSessionData;
      if (!sessionData.offer) throw new Error('No offer found in session');
      
      const remoteDesc = new RTCSessionDescription(sessionData.offer);
      await peerConnection.current.setRemoteDescription(remoteDesc);
      
      if (sessionData.candidatesOffer && sessionData.candidatesOffer.length > 0) {
        for (const candidate of sessionData.candidatesOffer) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
      
      peerConnection.current.ontrack = (event) => {
        if (remoteStream.current && event.track) {
          remoteStream.current.addTrack(event.track);
        }
      };
      
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          iceCandidates.current.push(event.candidate);
          updateSessionWithCandidate(event.candidate, false);
        }
      };
      
      peerConnection.current.onconnectionstatechange = () => {
        if (peerConnection.current) {
          console.log("Connection state:", peerConnection.current.connectionState);
          if (peerConnection.current.connectionState === 'connected') {
            setIsConnected(true);
          } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.current.connectionState)) {
            setIsConnected(false);
          }
        }
      };
      
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      
      if (session && sessionData) {
        const updatedSessionData: RTCSessionData = {
          ...sessionData,
          answer: answer,
          candidatesAnswer: sessionData.candidatesAnswer || []
        };
        
        await updateWebRTCSession(streamId, updatedSessionData);
        
        const subscription = supabase
          .channel(`webrtc_sessions:id=eq.${streamId}`)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'webrtc_sessions',
            filter: `id=eq.${streamId}`
          }, async (payload) => {
            const data = payload.new.data as RTCSessionData;
            
            if (data.candidatesOffer && data.candidatesOffer.length > 0) {
              for (const candidate of data.candidatesOffer) {
                await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
              }
            }
          })
          .subscribe();
      }
      
      return remoteStream.current;
    } catch (err: any) {
      console.error('Error joining WebRTC stream:', err);
      setError(err.message || 'Failed to join stream');
      toast({
        title: "Error",
        description: err.message || 'Failed to join stream',
        variant: "destructive",
      });
      return null;
    }
  }, [initializeWebRTC, streamId, toast]);

  const updateSessionWithCandidate = async (candidate: RTCIceCandidate, isOffer: boolean) => {
    try {
      const session = await getWebRTCSession(streamId);
      
      if (!session) throw new Error('Session not found');
      const sessionData = session.data as RTCSessionData;
      
      if (isOffer) {
        const candidatesOffer = sessionData.candidatesOffer || [];
        candidatesOffer.push(candidate.toJSON());
        sessionData.candidatesOffer = candidatesOffer;
      } else {
        const candidatesAnswer = sessionData.candidatesAnswer || [];
        candidatesAnswer.push(candidate.toJSON());
        sessionData.candidatesAnswer = candidatesAnswer;
      }
      
      await updateWebRTCSession(streamId, sessionData);
    } catch (err) {
      console.error('Error updating session with ICE candidate:', err);
    }
  };

  const endStream = useCallback(() => {
    try {
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
        localStream.current = null;
      }
      
      if (remoteStream.current) {
        remoteStream.current.getTracks().forEach(track => track.stop());
        remoteStream.current = null;
      }
      
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      
      setIsConnected(false);
      
      try {
        supabase
          .from('livestreams')
          .update({ is_active: false, ended_at: new Date().toISOString() })
          .eq('conference_id', streamId)
          .then(({ error }) => {
            if (error) {
              console.error('Error marking livestream as ended:', error);
            } else {
              console.log('Livestream marked as ended');
            }
          });
      } catch (err) {
        console.error('Error ending stream:', err);
      }
      
    } catch (err) {
      console.error('Error ending stream:', err);
    }
  }, [streamId]);

  const playRecording = useCallback(async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .storage
        .from('livestream_recordings')
        .createSignedUrl(`${streamId}/recording.webm`, 60 * 60); // 1 hour expiry
        
      if (error) throw error;
      
      return data.signedUrl;
    } catch (err: any) {
      console.error('Error getting recording URL:', err);
      setError(err.message || 'Failed to get recording URL');
      toast({
        title: "Error",
        description: 'Could not load recorded stream',
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [streamId, toast]);

  return {
    isLoading,
    isConnected,
    error,
    startStream,
    joinStream,
    endStream,
    playRecording,
    localStream: localStream.current,
    remoteStream: remoteStream.current
  };
};
