
import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

// WebRTC configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

interface WebRTCState {
  isConnected: boolean;
  isAudioOn: boolean;
  isVideoOn: boolean;
  isJoining: boolean;
  permissionsGranted: boolean;
}

export const usePureWebRTC = (roomId: string, isHost: boolean = false) => {
  const { toast } = useToast();
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  
  // Media streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  // WebRTC connection
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  
  // Signaling channel (using Supabase Realtime)
  const channelRef = useRef<any>(null);
  const clientIdRef = useRef<string>(uuidv4());
  
  // For detecting if remote user is muted
  const [isRemoteAudioMuted, setIsRemoteAudioMuted] = useState(false);
  const [isRemoteVideoMuted, setIsRemoteVideoMuted] = useState(false);
  
  // Setup WebRTC and request permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      console.log("usePureWebRTC: Requesting camera and microphone permissions...");
      
      // Request media permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      console.log("usePureWebRTC: Permissions granted", stream.getTracks().length);
      setPermissionsGranted(true);
      
      // Store the local stream
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      // Create a new remote stream
      const newRemoteStream = new MediaStream();
      remoteStreamRef.current = newRemoteStream;
      setRemoteStream(newRemoteStream);
      
      toast({
        title: "Permissions granted",
        description: "Camera and microphone access allowed",
      });
      
      return true;
    } catch (err: any) {
      console.error("usePureWebRTC: Permission error:", err);
      setPermissionsGranted(false);
      
      toast({
        title: "Permission Error",
        description: err.message || "Failed to access camera and microphone",
        variant: "destructive",
      });
      
      return false;
    }
  }, [toast]);
  
  // Initialize WebRTC peer connection
  const initializeCall = useCallback(async () => {
    try {
      setIsJoining(true);
      console.log("usePureWebRTC: Initializing call for room:", roomId);
      
      // Check permissions first
      if (!permissionsGranted) {
        const granted = await requestPermissions();
        if (!granted) {
          throw new Error("Camera and microphone permissions are required");
        }
      }
      
      // Create a new RTCPeerConnection
      const peerConnection = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = peerConnection;
      
      // Add local tracks to the peer connection
      if (localStreamRef.current) {
        console.log("usePureWebRTC: Adding local tracks to peer connection");
        localStreamRef.current.getTracks().forEach(track => {
          if (localStreamRef.current) {
            peerConnection.addTrack(track, localStreamRef.current);
          }
        });
      } else {
        throw new Error("Local stream not available");
      }
      
      // Listen for remote tracks
      peerConnection.ontrack = (event) => {
        console.log("usePureWebRTC: Remote track received", event);
        
        if (remoteStreamRef.current && event.streams && event.streams[0]) {
          // Add the new tracks to our remote stream
          event.streams[0].getTracks().forEach(track => {
            if (remoteStreamRef.current) {
              remoteStreamRef.current.addTrack(track);
              
              // Set connection state to true when we have remote tracks
              setIsConnected(true);
              console.log("usePureWebRTC: Connection established with remote peer");
              
              // Detect track kind and set muted state
              if (track.kind === 'audio') {
                setIsRemoteAudioMuted(false);
                
                // Listen for mute/unmute events
                track.onmute = () => setIsRemoteAudioMuted(true);
                track.onunmute = () => setIsRemoteAudioMuted(false);
              } else if (track.kind === 'video') {
                setIsRemoteVideoMuted(false);
                
                // Listen for mute/unmute events
                track.onmute = () => setIsRemoteVideoMuted(true);
                track.onunmute = () => setIsRemoteVideoMuted(false);
              }
            }
          });
          
          // Update the remote stream state
          setRemoteStream(remoteStreamRef.current);
        }
      };
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("usePureWebRTC: New ICE candidate", event.candidate);
          // Send the ICE candidate to the remote peer
          sendSignal({
            type: 'ice-candidate',
            candidate: event.candidate,
            roomId,
            senderId: clientIdRef.current,
          });
        }
      };
      
      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log("usePureWebRTC: Connection state changed:", peerConnection.connectionState);
        
        if (peerConnection.connectionState === 'connected') {
          setIsConnected(true);
        } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState)) {
          setIsConnected(false);
        }
      };
      
      console.log("usePureWebRTC: WebRTC initialized successfully");
      
      return peerConnection;
    } catch (error: any) {
      console.error("usePureWebRTC: Error initializing call:", error);
      
      toast({
        title: "Connection Error",
        description: error.message || "Failed to initialize call",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsJoining(false);
    }
  }, [roomId, permissionsGranted, requestPermissions, toast]);
  
  // Setup signaling using Supabase Realtime
  const setupSignaling = useCallback(() => {
    // Import supabase client
    const { supabase } = require('@/integrations/supabase/client');
    
    // Define a unique channel for this room
    const channel = supabase.channel(`webrtc-room-${roomId}`, {
      config: {
        broadcast: { self: false },
      },
    });
    
    // Listen for signaling messages
    channel
      .on('broadcast', { event: 'webrtc-signal' }, (payload: any) => {
        console.log("usePureWebRTC: Received signal", payload);
        
        // Ignore messages from ourselves
        if (payload.payload.senderId === clientIdRef.current) {
          return;
        }
        
        // Process signal based on type
        handleSignal(payload.payload);
      })
      .subscribe((status: string) => {
        console.log("usePureWebRTC: Supabase channel status:", status);
        
        if (status === 'SUBSCRIBED') {
          // If we're the host, we don't need to do anything yet
          // If we're not the host, initiate call
          if (!isHost) {
            console.log("usePureWebRTC: Non-host joining, initiating call");
            setTimeout(() => {
              makeCall();
            }, 1000);
          }
        }
      });
    
    // Store the channel reference for later use
    channelRef.current = channel;
    
    return () => {
      // Unsubscribe from the channel when component unmounts
      channel.unsubscribe();
    };
  }, [roomId, isHost]);
  
  // Send signaling messages
  const sendSignal = useCallback((signal: any) => {
    if (!channelRef.current) {
      console.error("usePureWebRTC: Signaling channel not initialized");
      return;
    }
    
    // Import supabase client
    const { supabase } = require('@/integrations/supabase/client');
    
    console.log("usePureWebRTC: Sending signal", signal);
    
    // Broadcast the signal to all peers in the room
    channelRef.current.send({
      type: 'broadcast',
      event: 'webrtc-signal',
      payload: signal,
    });
  }, []);
  
  // Handle incoming signaling messages
  const handleSignal = useCallback(async (signal: any) => {
    // Ensure the signal is for our room
    if (signal.roomId !== roomId) {
      return;
    }
    
    // Get the peer connection
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection) {
      console.error("usePureWebRTC: Peer connection not initialized");
      return;
    }
    
    try {
      // Handle different signal types
      switch (signal.type) {
        case 'offer':
          console.log("usePureWebRTC: Received offer, setting remote description");
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.offer));
          
          console.log("usePureWebRTC: Creating answer");
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          console.log("usePureWebRTC: Sending answer");
          sendSignal({
            type: 'answer',
            answer,
            roomId,
            senderId: clientIdRef.current,
          });
          break;
          
        case 'answer':
          console.log("usePureWebRTC: Received answer, setting remote description");
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.answer));
          break;
          
        case 'ice-candidate':
          console.log("usePureWebRTC: Received ICE candidate");
          await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
          break;
          
        default:
          console.warn("usePureWebRTC: Unknown signal type", signal.type);
      }
    } catch (error) {
      console.error("usePureWebRTC: Error handling signal:", error);
    }
  }, [roomId, sendSignal]);
  
  // Make a call (create and send an offer)
  const makeCall = useCallback(async () => {
    try {
      setIsJoining(true);
      
      // Make sure peer connection is initialized
      if (!peerConnectionRef.current) {
        console.log("usePureWebRTC: Initializing peer connection before making call");
        await initializeCall();
      }
      
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) {
        throw new Error("Failed to initialize peer connection");
      }
      
      console.log("usePureWebRTC: Creating offer");
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      console.log("usePureWebRTC: Sending offer");
      sendSignal({
        type: 'offer',
        offer,
        roomId,
        senderId: clientIdRef.current,
      });
      
      toast({
        title: "Connecting",
        description: "Attempting to connect to the remote peer",
      });
    } catch (error: any) {
      console.error("usePureWebRTC: Error making call:", error);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to make call",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  }, [initializeCall, roomId, sendSignal, toast]);
  
  // Toggle mic
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const enabled = !isAudioOn;
        audioTracks.forEach(track => {
          track.enabled = enabled;
        });
        setIsAudioOn(enabled);
      }
    }
  }, [isAudioOn]);
  
  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const enabled = !isVideoOn;
        videoTracks.forEach(track => {
          track.enabled = enabled;
        });
        setIsVideoOn(enabled);
      }
    }
  }, [isVideoOn]);
  
  // End call
  const endCall = useCallback(() => {
    // Close the peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Stop all local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    
    // Clear remote stream
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
      setRemoteStream(null);
    }
    
    // Reset state
    setIsConnected(false);
    
    toast({
      title: "Call Ended",
      description: "You've disconnected from the call",
    });
  }, [toast]);
  
  // Initialize everything when the component mounts
  useEffect(() => {
    console.log("usePureWebRTC: Setting up WebRTC for room", roomId);
    
    // Start by setting up signaling
    const cleanupSignaling = setupSignaling();
    
    // Return cleanup function
    return () => {
      console.log("usePureWebRTC: Cleaning up WebRTC");
      
      // End the call if it's still active
      endCall();
      
      // Clean up signaling
      if (cleanupSignaling) cleanupSignaling();
    };
  }, [roomId, setupSignaling, endCall]);
  
  return {
    isConnected,
    isAudioOn,
    isVideoOn,
    isJoining,
    permissionsGranted,
    isRemoteAudioMuted,
    isRemoteVideoMuted,
    localStream,
    remoteStream,
    initializeCall,
    makeCall,
    requestPermissions,
    toggleMic,
    toggleVideo,
    endCall
  };
};
