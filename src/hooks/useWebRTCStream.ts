
import { useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getWebRTCSession, updateWebRTCSession, WebRTCSession, WebRTCSessionData } from '@/integrations/supabase/webrtc-sessions';
import { Json } from '@/integrations/supabase/types';

export const useWebRTCStream = (streamId: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('initializing');
  const { toast } = useToast();

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  
  const iceCandidates = useRef<RTCIceCandidate[]>([]);
  const subscriptionRef = useRef<any>(null);

  const initializeWebRTC = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setConnectionStatus('initializing');
      console.log(`[WebRTC] Initializing WebRTC for stream: ${streamId}`);
      
      // More comprehensive ICE server configuration
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
        ],
        iceCandidatePoolSize: 10
      };
      
      // Clean up any existing connection
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      
      peerConnection.current = new RTCPeerConnection(configuration);
      
      // Set up debugging listeners for connection state
      if (peerConnection.current) {
        peerConnection.current.addEventListener('connectionstatechange', () => {
          const state = peerConnection.current?.connectionState;
          console.log(`[WebRTC] Connection state changed: ${state}`);
          setConnectionStatus(state || 'unknown');
        });
        
        peerConnection.current.addEventListener('iceconnectionstatechange', () => {
          const state = peerConnection.current?.iceConnectionState;
          console.log(`[WebRTC] ICE connection state changed: ${state}`);
        });
        
        peerConnection.current.addEventListener('icegatheringstatechange', () => {
          const state = peerConnection.current?.iceGatheringState;
          console.log(`[WebRTC] ICE gathering state changed: ${state}`);
        });
        
        peerConnection.current.addEventListener('negotiationneeded', () => {
          console.log(`[WebRTC] Negotiation needed`);
        });
      }
      
      remoteStream.current = new MediaStream();
      
      return true;
    } catch (err: any) {
      console.error('[WebRTC] Error initializing WebRTC:', err);
      setError(err.message || 'Failed to initialize WebRTC');
      setConnectionStatus('failed');
      toast({
        title: "WebRTC Error",
        description: err.message || 'Failed to initialize WebRTC',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, streamId]);

  const startStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      console.log(`[WebRTC] Starting stream as host for: ${streamId}`);
      
      if (!peerConnection.current) {
        const initialized = await initializeWebRTC();
        if (!initialized) return null;
      }
      
      console.log('[WebRTC] Requesting user media...');
      localStream.current = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      console.log('[WebRTC] User media obtained successfully. Adding tracks to peer connection.');
      
      if (peerConnection.current && localStream.current) {
        localStream.current.getTracks().forEach(track => {
          if (peerConnection.current && localStream.current) {
            console.log(`[WebRTC] Adding track: ${track.kind} to peer connection`);
            peerConnection.current.addTrack(track, localStream.current);
          }
        });
      }
      
      if (peerConnection.current) {
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            console.log(`[WebRTC] New ICE candidate: ${event.candidate.candidate}`);
            iceCandidates.current.push(event.candidate);
            updateSessionWithCandidate(event.candidate, true);
          } else {
            console.log('[WebRTC] ICE candidate gathering complete');
          }
        };
        
        peerConnection.current.onconnectionstatechange = () => {
          if (peerConnection.current) {
            console.log(`[WebRTC] Connection state changed: ${peerConnection.current.connectionState}`);
            setConnectionStatus(peerConnection.current.connectionState);
            
            if (peerConnection.current.connectionState === 'connected') {
              console.log('[WebRTC] Connection established successfully!');
              setIsConnected(true);
              toast({
                title: "Connected",
                description: "Livestream connection established successfully",
              });
            } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.current.connectionState)) {
              console.log(`[WebRTC] Connection ${peerConnection.current.connectionState}`);
              setIsConnected(false);
            }
          }
        };
        
        console.log('[WebRTC] Creating offer...');
        const offer = await peerConnection.current.createOffer();
        console.log('[WebRTC] Setting local description...');
        await peerConnection.current.setLocalDescription(offer);
        
        const sessionData: WebRTCSessionData = {
          sessionId: streamId,
          offer: offer,
          candidatesOffer: []
        };
        
        console.log('[WebRTC] Storing session data in database...');
        try {
          await supabase
            .from('webrtc_sessions')
            .upsert({ 
              id: streamId,
              data: sessionData as unknown as Json,
              created_at: new Date().toISOString()
            });
          console.log('[WebRTC] Session data stored successfully.');
        } catch (err) {
          console.error('[WebRTC] Error storing session:', err);
        }
        
        // Create a subscription only if one doesn't exist
        if (!subscriptionRef.current) {
          console.log('[WebRTC] Setting up Supabase realtime subscription...');
          subscriptionRef.current = supabase
            .channel(`webrtc_sessions:id=eq.${streamId}`)
            .on('postgres_changes', { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'webrtc_sessions',
              filter: `id=eq.${streamId}`
            }, async (payload) => {
              console.log('[WebRTC] Received session update:', payload.new);
              const sessionData = payload.new.data as WebRTCSessionData;
              
              if (sessionData.answer && peerConnection.current?.currentRemoteDescription === null) {
                console.log('[WebRTC] Setting remote description from answer...');
                try {
                  const remoteDesc = new RTCSessionDescription(sessionData.answer);
                  await peerConnection.current?.setRemoteDescription(remoteDesc);
                  console.log('[WebRTC] Remote description set successfully.');
                  
                  if (sessionData.candidatesAnswer && sessionData.candidatesAnswer.length > 0) {
                    console.log(`[WebRTC] Processing ${sessionData.candidatesAnswer.length} remote ICE candidates...`);
                    for (const candidate of sessionData.candidatesAnswer) {
                      try {
                        await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
                        console.log('[WebRTC] Remote ICE candidate added successfully.');
                      } catch (err) {
                        console.error('[WebRTC] Error adding remote ICE candidate:', err);
                      }
                    }
                  }
                } catch (err) {
                  console.error('[WebRTC] Error setting remote description:', err);
                }
              }
              
              if (sessionData.candidatesAnswer && sessionData.candidatesAnswer.length > 0) {
                console.log(`[WebRTC] Processing ${sessionData.candidatesAnswer.length} remote ICE candidates...`);
                for (const candidate of sessionData.candidatesAnswer) {
                  try {
                    await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log('[WebRTC] Remote ICE candidate added successfully.');
                  } catch (err) {
                    console.error('[WebRTC] Error adding remote ICE candidate:', err);
                  }
                }
              }
            })
            .subscribe((status) => {
              console.log(`[WebRTC] Supabase subscription status: ${status}`);
            });
        }
          
        return localStream.current;
      }
      
      return null;
    } catch (err: any) {
      console.error('[WebRTC] Error starting WebRTC stream:', err);
      setError(err.message || 'Failed to start stream');
      setConnectionStatus('failed');
      toast({
        title: "Stream Error",
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
      const sessionData = session.data as WebRTCSessionData;
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
        const updatedSessionData: WebRTCSessionData = {
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
            const data = payload.new.data as WebRTCSessionData;
            
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
      console.log(`[WebRTC] Updating session with new ${isOffer ? 'offer' : 'answer'} ICE candidate`);
      const session = await getWebRTCSession(streamId);
      
      if (!session) {
        console.error('[WebRTC] Session not found when trying to update candidate');
        throw new Error('Session not found');
      }
      
      const sessionData = session.data;
      
      if (isOffer) {
        const candidatesOffer = sessionData.candidatesOffer || [];
        candidatesOffer.push(candidate.toJSON());
        sessionData.candidatesOffer = candidatesOffer;
      } else {
        const candidatesAnswer = sessionData.candidatesAnswer || [];
        candidatesAnswer.push(candidate.toJSON());
        sessionData.candidatesAnswer = candidatesAnswer;
      }
      
      const result = await updateWebRTCSession(streamId, sessionData);
      if (result) {
        console.log('[WebRTC] Session updated with ICE candidate successfully');
      } else {
        console.error('[WebRTC] Failed to update session with ICE candidate');
      }
    } catch (err) {
      console.error('[WebRTC] Error updating session with ICE candidate:', err);
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
    connectionStatus,
    startStream,
    joinStream,
    endStream,
    playRecording,
    localStream: localStream.current,
    remoteStream: remoteStream.current
  };
};
