
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  getOrCreateStreamSession,
  getStreamSession,
  updateSessionOffer,
  updateSessionAnswer,
  appendOfferCandidate,
  appendAnswerCandidate,
  StreamSessionData
} from '@/integrations/supabase/stream-sessions';

interface StreamSession {
  id: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  offerCandidates: RTCIceCandidateInit[];
  answerCandidates: RTCIceCandidateInit[];
}

export const useStreamConnection = (streamId: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const { toast } = useToast();

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const sessionRef = useRef<StreamSession | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Configure connection with ICE servers
  const createPeerConnection = useCallback(() => {
    console.log("Creating RTCPeerConnection...");
    
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
      ]
    });
    
    // Create a remote stream for receiving video
    const remote = new MediaStream();
    setRemoteStream(remote);
    
    // Set up event handlers
    peerConnection.current.onicecandidate = handleICECandidate;
    peerConnection.current.ontrack = handleTrackEvent;
    peerConnection.current.onconnectionstatechange = handleConnectionStateChange;
    
    console.log("RTCPeerConnection created");
    return peerConnection.current;
  }, []);

  // Handle incoming media tracks
  const handleTrackEvent = (event: RTCTrackEvent) => {
    console.log("Track received:", event.track.kind);
    if (remoteStream) {
      remoteStream.addTrack(event.track);
      setRemoteStream(new MediaStream([...remoteStream.getTracks(), event.track]));
    }
  };

  // Handle connection state changes
  const handleConnectionStateChange = () => {
    if (!peerConnection.current) return;
    
    console.log("Connection state changed:", peerConnection.current.connectionState);
    
    if (peerConnection.current.connectionState === 'connected') {
      setIsConnected(true);
      setIsLoading(false);
      toast({
        title: "Connected",
        description: "Stream connection established successfully"
      });
    } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.current.connectionState)) {
      setIsConnected(false);
      if (peerConnection.current.connectionState === 'failed') {
        setError("Connection failed. Please try again.");
        toast({
          title: "Connection Failed",
          description: "Stream connection failed. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  // Handle ICE candidates
  const handleICECandidate = async (event: RTCPeerConnectionIceEvent) => {
    if (!event.candidate) return;
    
    console.log("New ICE candidate:", event.candidate.candidate);
    
    try {
      if (isHost) {
        // Host adds candidate to offerCandidates
        await appendOfferCandidate(streamId, event.candidate.toJSON());
      } else {
        // Viewer adds candidate to answerCandidates
        await appendAnswerCandidate(streamId, event.candidate.toJSON());
      }
    } catch (err) {
      console.error("Error saving ICE candidate:", err);
    }
  };

  // Set up Supabase realtime subscription
  const setupSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }
    
    console.log("Setting up subscription for stream:", streamId);
    
    subscriptionRef.current = supabase
      .channel(`stream-${streamId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'stream_sessions',
        filter: `id=eq.${streamId}`
      }, handleSessionUpdate)
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });
      
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [streamId]);

  // Convert Supabase session data to StreamSession format
  const convertSessionData = (data: StreamSessionData): StreamSession => {
    return {
      id: data.id,
      offer: data.offer,
      answer: data.answer,
      offerCandidates: data.offer_candidates || [],
      answerCandidates: data.answer_candidates || []
    };
  };

  // Handle session updates from Supabase
  const handleSessionUpdate = async (payload: any) => {
    console.log("Session update received:", payload);
    
    try {
      const sessionData = await getStreamSession(streamId);
      if (!sessionData) return;
      
      const session = convertSessionData(sessionData);
      sessionRef.current = session;
      
      if (!isHost && session.offer && !peerConnection.current?.remoteDescription) {
        console.log("Setting remote description (offer)");
        await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(session.offer));
        
        // Process any existing ICE candidates
        if (session.offerCandidates.length > 0) {
          for (const candidate of session.offerCandidates) {
            console.log("Adding ICE candidate from offer");
            await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
        
        // Create answer
        console.log("Creating answer");
        const answer = await peerConnection.current?.createAnswer();
        await peerConnection.current?.setLocalDescription(answer);
        
        // Save answer to Supabase
        if (answer) {
          await updateSessionAnswer(streamId, answer);
        }
      }
      
      if (isHost && session.answer && !peerConnection.current?.remoteDescription) {
        console.log("Setting remote description (answer)");
        await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(session.answer));
        
        // Process any existing ICE candidates
        if (session.answerCandidates.length > 0) {
          for (const candidate of session.answerCandidates) {
            console.log("Adding ICE candidate from answer");
            await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
      }
      
      // Process new ICE candidates
      if (!isHost && session.offerCandidates.length > 0) {
        for (const candidate of session.offerCandidates) {
          if (!peerConnection.current?.remoteDescription) continue;
          console.log("Adding ICE candidate from offer");
          try {
            await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
          }
        }
      }
      
      if (isHost && session.answerCandidates.length > 0) {
        for (const candidate of session.answerCandidates) {
          if (!peerConnection.current?.remoteDescription) continue;
          console.log("Adding ICE candidate from answer");
          try {
            await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
          }
        }
      }
    } catch (err) {
      console.error("Error handling session update:", err);
      setError("Failed to establish connection. Please try again.");
    }
  };

  // Start stream as host
  const startStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      setIsLoading(true);
      setError(null);
      setIsHost(true);
      console.log("Starting stream as host for:", streamId);
      
      // Create a new session or get existing one
      const sessionData = await getOrCreateStreamSession(streamId);
      if (!sessionData) {
        throw new Error("Failed to create stream session");
      }
      
      sessionRef.current = convertSessionData(sessionData);
      
      // Set up subscription
      setupSubscription();
      
      // Get user media
      console.log("Requesting user media...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      
      // Create peer connection
      const pc = createPeerConnection();
      
      // Add tracks to the peer connection
      stream.getTracks().forEach(track => {
        console.log("Adding track to peer connection:", track.kind);
        pc.addTrack(track, stream);
      });
      
      // Create offer
      console.log("Creating offer...");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Save offer to Supabase
      await updateSessionOffer(streamId, offer);
      
      setIsLoading(false);
      return stream;
    } catch (err: any) {
      console.error("Error starting stream:", err);
      setError(err.message || "Failed to start stream");
      setIsLoading(false);
      toast({
        title: "Error",
        description: err.message || "Failed to start stream",
        variant: "destructive"
      });
      return null;
    }
  }, [streamId, createPeerConnection, setupSubscription, toast]);

  // Join stream as viewer
  const joinStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      setIsLoading(true);
      setError(null);
      setIsHost(false);
      console.log("Joining stream as viewer for:", streamId);
      
      // Get session
      const sessionData = await getStreamSession(streamId);
      if (!sessionData) {
        throw new Error("Failed to get stream session");
      }
      
      if (!sessionData.offer) {
        throw new Error("Stream not found or not started");
      }
      
      sessionRef.current = convertSessionData(sessionData);
      
      // Set up subscription
      setupSubscription();
      
      // Create peer connection
      const pc = createPeerConnection();
      
      // Set remote description (offer)
      console.log("Setting remote description (offer)");
      await pc.setRemoteDescription(new RTCSessionDescription(sessionData.offer));
      
      // Process any existing ICE candidates
      if (sessionData.offer_candidates.length > 0) {
        for (const candidate of sessionData.offer_candidates) {
          console.log("Adding ICE candidate from offer");
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
      
      // Create answer
      console.log("Creating answer");
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      // Save answer to Supabase
      await updateSessionAnswer(streamId, answer);
      
      setIsLoading(false);
      return remoteStream;
    } catch (err: any) {
      console.error("Error joining stream:", err);
      setError(err.message || "Failed to join stream");
      setIsLoading(false);
      toast({
        title: "Error",
        description: err.message || "Failed to join stream",
        variant: "destructive"
      });
      return null;
    }
  }, [streamId, createPeerConnection, setupSubscription, remoteStream, toast]);

  // End stream
  const endStream = useCallback(async () => {
    console.log("Ending stream");
    
    // Stop local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    // Clean up remote stream
    setRemoteStream(null);
    setIsConnected(false);
    
    // If host, mark the livestream as ended
    if (isHost) {
      try {
        await supabase
          .from('livestreams')
          .update({
            is_active: false,
            ended_at: new Date().toISOString()
          })
          .eq('conference_id', streamId);
        
        console.log("Livestream marked as ended");
      } catch (err) {
        console.error("Error marking livestream as ended:", err);
      }
    }
    
    // Remove subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  }, [streamId, isHost, localStream]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      endStream();
    };
  }, [endStream]);

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
