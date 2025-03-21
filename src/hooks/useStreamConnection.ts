
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  getOrCreateStreamSession, 
  getStreamSession,
  updateSessionOffer,
  updateSessionAnswer,
  appendOfferCandidate,
  appendAnswerCandidate 
} from '@/integrations/supabase/stream-sessions';

export const useStreamConnection = (streamId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const iceCandidates = useRef<RTCIceCandidateInit[]>([]);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clean up any peer connection, streams, and polling
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [localStream]);
  
  // Get user media
  const getUserMedia = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      return stream;
    } catch (err: any) {
      console.error('Error getting user media:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera and microphone access denied. Please allow access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found. Please connect a device and try again.');
      } else {
        setError(`Failed to access media devices: ${err.message}`);
      }
      return null;
    }
  }, []);
  
  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    };
    
    const pc = new RTCPeerConnection(config);
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        iceCandidates.current.push(event.candidate.toJSON());
        
        // Store the candidate depending on role
        if (isHost) {
          appendOfferCandidate(streamId, event.candidate.toJSON());
        } else {
          appendAnswerCandidate(streamId, event.candidate.toJSON());
        }
      }
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state changed:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
        setIsLoading(false);
        setError(null);
      } else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        setIsConnected(false);
      }
    };
    
    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state changed:', pc.iceConnectionState);
    };
    
    // Set up remote track handling
    pc.ontrack = (event) => {
      console.log('Received remote track');
      const remote = new MediaStream();
      event.streams[0].getTracks().forEach(track => {
        remote.addTrack(track);
      });
      setRemoteStream(remote);
    };
    
    return pc;
  }, [isHost, streamId]);
  
  // Start streaming as host
  const startStream = useCallback(async () => {
    if (!user) {
      setError('You must be logged in to start a stream');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setIsHost(true);
      
      // Get user media
      const stream = await getUserMedia();
      if (!stream) {
        throw new Error('Failed to get user media');
      }
      setLocalStream(stream);
      
      // Create and store session
      const session = await getOrCreateStreamSession(streamId);
      if (!session) {
        throw new Error('Failed to create stream session');
      }
      
      // Create peer connection
      const pc = createPeerConnection();
      peerConnection.current = pc;
      
      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Store offer in session
      await updateSessionOffer(streamId, offer);
      
      // Poll for answer
      pollingInterval.current = setInterval(async () => {
        const updatedSession = await getStreamSession(streamId);
        if (!updatedSession || !updatedSession.answer || pc.currentRemoteDescription) return;
        
        console.log('Got remote answer, setting remote description');
        await pc.setRemoteDescription(new RTCSessionDescription(updatedSession.answer));
        
        // Add any answer candidates
        if (updatedSession.answer_candidates && updatedSession.answer_candidates.length > 0) {
          for (const candidate of updatedSession.answer_candidates) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
        
        // Clear polling interval
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
          pollingInterval.current = null;
        }
      }, 1000);
      
    } catch (err: any) {
      console.error('Error starting stream:', err);
      setError(err.message || 'Failed to start stream');
      setIsLoading(false);
      
      // Clean up
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
    }
  }, [user, streamId, getUserMedia, createPeerConnection]);
  
  // Join stream as viewer
  const joinStream = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsHost(false);
      
      // Get session
      const session = await getStreamSession(streamId);
      if (!session || !session.offer) {
        throw new Error('Stream not found or not ready to join');
      }
      
      // Create peer connection
      const pc = createPeerConnection();
      peerConnection.current = pc;
      
      // Set remote description (host's offer)
      await pc.setRemoteDescription(new RTCSessionDescription(session.offer));
      
      // Add any ICE candidates from host
      if (session.offer_candidates && session.offer_candidates.length > 0) {
        for (const candidate of session.offer_candidates) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
      
      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      // Store answer in session
      await updateSessionAnswer(streamId, answer);
      
    } catch (err: any) {
      console.error('Error joining stream:', err);
      setError(err.message || 'Failed to join stream');
      setIsLoading(false);
      
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
    }
  }, [streamId, createPeerConnection]);
  
  // End stream for both host and viewer
  const endStream = useCallback(() => {
    console.log('Ending stream');
    
    // Stop local streams
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    // Clear interval
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    
    setIsConnected(false);
    setIsLoading(false);
    
    // Mark livestream as ended if host
    if (isHost) {
      try {
        supabase
          .from('livestreams')
          .update({ is_active: false, ended_at: new Date().toISOString() })
          .eq('conference_id', streamId);
      } catch (err) {
        console.error('Error ending livestream:', err);
      }
    }
  }, [isHost, localStream, streamId]);
  
  return {
    isLoading,
    isConnected,
    isHost,
    error,
    localStream,
    remoteStream,
    startStream,
    joinStream,
    endStream
  };
};
