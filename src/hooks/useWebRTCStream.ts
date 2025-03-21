
import { useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  
  // Store ice candidates until peer connection is ready
  const iceCandidates = useRef<RTCIceCandidate[]>([]);

  // Initialize WebRTC
  const initializeWebRTC = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Create a new peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      };
      
      peerConnection.current = new RTCPeerConnection(configuration);
      
      // Create new streams
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

  // Start a livestream (host)
  const startStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      if (!peerConnection.current) {
        const initialized = await initializeWebRTC();
        if (!initialized) return null;
      }
      
      // Get user media
      localStream.current = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // Add tracks to peer connection
      if (peerConnection.current && localStream.current) {
        localStream.current.getTracks().forEach(track => {
          if (peerConnection.current && localStream.current) {
            peerConnection.current.addTrack(track, localStream.current);
          }
        });
      }
      
      // Set up event handlers for the peer connection
      if (peerConnection.current) {
        // Handle ICE candidates
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            // Store ice candidates
            iceCandidates.current.push(event.candidate);
            
            // Update database with new ice candidate
            updateSessionWithCandidate(event.candidate, true);
          }
        };
        
        // Handle connection state changes
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
        
        // Create and store the offer
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        
        // Save the session to the database
        const sessionData: RTCSessionData = {
          sessionId: streamId,
          offer: offer,
          candidatesOffer: []
        };
        
        await supabase
          .from('webrtc_sessions')
          .upsert({ 
            id: streamId,
            data: sessionData,
            created_at: new Date().toISOString()
          } as any);
          
        // Listen for answers
        const subscription = supabase
          .channel(`webrtc_sessions:id=eq.${streamId}`)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'webrtc_sessions',
            filter: `id=eq.${streamId}`
          }, async (payload) => {
            const data = payload.new.data as RTCSessionData;
            
            // If we have an answer but haven't set it yet
            if (data.answer && peerConnection.current?.currentRemoteDescription === null) {
              const remoteDesc = new RTCSessionDescription(data.answer);
              await peerConnection.current?.setRemoteDescription(remoteDesc);
              
              // Add any ice candidates from answer
              if (data.candidatesAnswer && data.candidatesAnswer.length > 0) {
                for (const candidate of data.candidatesAnswer) {
                  await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
                }
              }
            }
            
            // If there are new answer candidates
            if (data.candidatesAnswer && data.candidatesAnswer.length > 0) {
              for (const candidate of data.candidatesAnswer) {
                await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
              }
            }
          })
          .subscribe();
          
        // Return the local stream for displaying in UI
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
  
  // Join a livestream (viewer)
  const joinStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      if (!peerConnection.current) {
        const initialized = await initializeWebRTC();
        if (!initialized) return null;
      }
      
      // Fetch the session data
      const { data, error } = await supabase
        .from('webrtc_sessions')
        .select('*')
        .eq('id', streamId)
        .single() as any;
        
      if (error) throw error;
      if (!data) throw new Error('Session not found');
      
      const sessionData = data.data as RTCSessionData;
      if (!sessionData.offer) throw new Error('No offer found in session');
      
      // Set the remote description (offer)
      const remoteDesc = new RTCSessionDescription(sessionData.offer);
      await peerConnection.current.setRemoteDescription(remoteDesc);
      
      // Handle ICE candidates from the offer
      if (sessionData.candidatesOffer && sessionData.candidatesOffer.length > 0) {
        for (const candidate of sessionData.candidatesOffer) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
      
      // Handle incoming tracks
      peerConnection.current.ontrack = (event) => {
        if (remoteStream.current && event.track) {
          remoteStream.current.addTrack(event.track);
        }
      };
      
      // Handle ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          // Store locally
          iceCandidates.current.push(event.candidate);
          
          // Update database with new ice candidate
          updateSessionWithCandidate(event.candidate, false);
        }
      };
      
      // Handle connection state changes
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
      
      // Create and send answer
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      
      // Update the session with our answer
      await supabase
        .from('webrtc_sessions')
        .update({
          data: {
            ...sessionData,
            answer: answer,
            candidatesAnswer: []
          }
        } as any)
        .eq('id', streamId);
        
      // Listen for offer candidate updates
      const subscription = supabase
        .channel(`webrtc_sessions:id=eq.${streamId}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'webrtc_sessions',
          filter: `id=eq.${streamId}`
        }, async (payload) => {
          const data = payload.new.data as RTCSessionData;
          
          // If there are new offer candidates
          if (data.candidatesOffer && data.candidatesOffer.length > 0) {
            for (const candidate of data.candidatesOffer) {
              await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
            }
          }
        })
        .subscribe();
      
      // Return the remote stream for display
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

  // Helper to update session with ICE candidates
  const updateSessionWithCandidate = async (candidate: RTCIceCandidate, isOffer: boolean) => {
    try {
      // Get the current session data
      const { data, error } = await supabase
        .from('webrtc_sessions')
        .select('*')
        .eq('id', streamId)
        .single() as any;
        
      if (error) throw error;
      if (!data) throw new Error('Session not found');
      
      const sessionData = data.data as RTCSessionData;
      
      // Update the appropriate candidates array
      if (isOffer) {
        const candidatesOffer = sessionData.candidatesOffer || [];
        candidatesOffer.push(candidate.toJSON());
        sessionData.candidatesOffer = candidatesOffer;
      } else {
        const candidatesAnswer = sessionData.candidatesAnswer || [];
        candidatesAnswer.push(candidate.toJSON());
        sessionData.candidatesAnswer = candidatesAnswer;
      }
      
      // Update the session
      await supabase
        .from('webrtc_sessions')
        .update({ data: sessionData } as any)
        .eq('id', streamId);
    } catch (err) {
      console.error('Error updating session with ICE candidate:', err);
    }
  };

  // End stream and clean up
  const endStream = useCallback(() => {
    try {
      // Close media streams
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
        localStream.current = null;
      }
      
      if (remoteStream.current) {
        remoteStream.current.getTracks().forEach(track => track.stop());
        remoteStream.current = null;
      }
      
      // Close peer connection
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      
      // Update connection state
      setIsConnected(false);
      
      // Mark livestream as ended in database if we're the host
      supabase
        .from('livestreams')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('conference_id', streamId)
        .then(() => {
          console.log('Livestream marked as ended');
        })
        .catch(err => {
          console.error('Error marking livestream as ended:', err);
        });
      
    } catch (err) {
      console.error('Error ending stream:', err);
    }
  }, [streamId]);
  
  // Play recorded stream
  const playRecording = useCallback(async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      
      // Get recording URL from storage
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
