
import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

type MediaTracks = {
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
  remoteAudioTrack: MediaStreamTrack | null;
  remoteVideoTrack: MediaStreamTrack | null;
};

interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connection: RTCPeerConnection | null;
  isHost: boolean;
  isConnected: boolean;
  isVideoOn: boolean;
  isAudioOn: boolean;
  permissionsGranted: boolean;
}

export const useWebRTC = (roomId: string) => {
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  
  // WebRTC connection
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  
  const localVideoContainerRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoContainerRef = useRef<HTMLDivElement | null>(null);
  
  // For signaling - in a real app, you would use a server
  // Here we'll use localStorage as a simple signaling mechanism
  const signallingKey = `webrtc-signal-${roomId}`;
  
  // Request permissions explicitly
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      console.log("Explicitly requesting camera and microphone permissions...");
      
      // This will trigger the browser permission dialog
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      console.log("Camera and microphone permissions granted successfully");
      
      // Store the stream for later use
      localStreamRef.current = stream;
      
      setPermissionsGranted(true);
      toast({
        title: "Permissions granted",
        description: "Camera and microphone access allowed",
      });
      
      return true;
    } catch (err: any) {
      console.error("Permission error:", err);
      
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
  const initializePeerConnection = useCallback(() => {
    // Create a new RTCPeerConnection
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    });
    
    // Set up event handlers
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Send the ICE candidate to the remote peer via signaling
        const signal = {
          type: 'ice-candidate',
          candidate: event.candidate,
          roomId
        };
        localStorage.setItem(signallingKey, JSON.stringify(signal));
      }
    };
    
    pc.ontrack = (event) => {
      console.log("Received remote track", event.track.kind);
      
      // Add the remote track to our remote stream
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }
      
      remoteStreamRef.current.addTrack(event.track);
      
      // If this is a video track and we have a remote video container, play it
      if (event.track.kind === 'video' && remoteVideoContainerRef.current) {
        const videoElement = document.createElement('video');
        videoElement.srcObject = remoteStreamRef.current;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        
        // Clear previous content and append the video
        if (remoteVideoContainerRef.current) {
          remoteVideoContainerRef.current.innerHTML = '';
          remoteVideoContainerRef.current.appendChild(videoElement);
        }
      }
      
      setIsConnected(true);
    };
    
    pc.onconnectionstatechange = () => {
      console.log("Connection state changed:", pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
        toast({
          title: "Connected",
          description: "You are now connected to the other peer",
        });
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnected(false);
        toast({
          title: "Disconnected",
          description: "Connection to peer lost",
          variant: "destructive",
        });
      }
    };
    
    peerConnection.current = pc;
    return pc;
  }, [roomId, toast]);
  
  // Initialize the call by setting up the peer connection and adding tracks
  const initializeCall = async (
    localVideoElement: HTMLDivElement,
    remoteVideoElement: HTMLDivElement
  ) => {
    try {
      setIsJoining(true);
      
      localVideoContainerRef.current = localVideoElement;
      remoteVideoContainerRef.current = remoteVideoElement;
      
      // Check if permissions already granted or request them
      if (!permissionsGranted || !localStreamRef.current) {
        const granted = await requestPermissions();
        if (!granted) {
          throw new Error("Camera and microphone permissions are required");
        }
      }
      
      // Initialize the peer connection
      const pc = initializePeerConnection();
      
      // Add local tracks to the peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          if (localStreamRef.current) {
            pc.addTrack(track, localStreamRef.current);
          }
        });
        
        // Display local video
        const videoElement = document.createElement('video');
        videoElement.srcObject = localStreamRef.current;
        videoElement.autoplay = true;
        videoElement.muted = true; // Mute local video to prevent feedback
        videoElement.playsInline = true;
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        
        // Clear previous content and append the video
        if (localVideoElement) {
          localVideoElement.innerHTML = '';
          localVideoElement.appendChild(videoElement);
        }
      }
      
      // Set up signaling channel listener
      window.addEventListener('storage', handleSignalingMessage);
      
      toast({
        title: "Ready to connect",
        description: "Waiting for another peer to join...",
      });
      
    } catch (error: any) {
      console.error('Error initializing WebRTC:', error);
      toast({
        title: "Connection Error",
        description: error.message || "Could not set up WebRTC connection",
        variant: "destructive",
      });
      
      // Clean up any streams we might have created
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      throw error;
    } finally {
      setIsJoining(false);
    }
  };
  
  // Handle incoming signaling messages (using localStorage in this simple example)
  const handleSignalingMessage = useCallback((event: StorageEvent) => {
    if (event.key !== signallingKey || !event.newValue) return;
    
    try {
      const signal = JSON.parse(event.newValue);
      
      if (signal.roomId !== roomId) return;
      
      if (signal.type === 'offer' && peerConnection.current) {
        handleOffer(signal);
      } else if (signal.type === 'answer' && peerConnection.current) {
        handleAnswer(signal);
      } else if (signal.type === 'ice-candidate' && peerConnection.current) {
        handleICECandidate(signal);
      }
    } catch (err) {
      console.error('Error parsing signaling message:', err);
    }
  }, [roomId]);
  
  // Handle an incoming offer
  const handleOffer = async (signal: any) => {
    if (!peerConnection.current) return;
    
    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal.offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      
      // Send the answer to the offering peer
      const answerSignal = {
        type: 'answer',
        answer,
        roomId
      };
      localStorage.setItem(signallingKey, JSON.stringify(answerSignal));
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  };
  
  // Handle an incoming answer
  const handleAnswer = async (signal: any) => {
    if (!peerConnection.current) return;
    
    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal.answer));
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  };
  
  // Handle an incoming ICE candidate
  const handleICECandidate = async (signal: any) => {
    if (!peerConnection.current) return;
    
    try {
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
    } catch (err) {
      console.error('Error handling ICE candidate:', err);
    }
  };
  
  // Initiate a call (create and send an offer)
  const makeCall = async () => {
    if (!peerConnection.current || !localStreamRef.current) {
      toast({
        title: "Error",
        description: "Cannot make call - connection not initialized",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      
      // Send the offer to the remote peer
      const signal = {
        type: 'offer',
        offer,
        roomId
      };
      localStorage.setItem(signallingKey, JSON.stringify(signal));
      
      toast({
        title: "Calling",
        description: "Sending connection request...",
      });
    } catch (err) {
      console.error('Error making call:', err);
      toast({
        title: "Call Error",
        description: "Failed to create connection offer",
        variant: "destructive",
      });
    }
  };
  
  // Toggle microphone
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
    try {
      // Close the peer connection
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      
      // Stop all local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      // Clear the remote stream
      remoteStreamRef.current = null;
      
      // Remove event listener
      window.removeEventListener('storage', handleSignalingMessage);
      
      // Reset states
      setIsConnected(false);
      setIsVideoOn(true);
      setIsAudioOn(true);
      
      // Clear the local and remote video containers
      if (localVideoContainerRef.current) {
        localVideoContainerRef.current.innerHTML = '';
      }
      if (remoteVideoContainerRef.current) {
        remoteVideoContainerRef.current.innerHTML = '';
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, [handleSignalingMessage]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);
  
  return {
    isConnected,
    isAudioOn,
    isVideoOn,
    isJoining,
    permissionsGranted,
    makeCall,
    initializeCall,
    requestPermissions,
    toggleMic,
    toggleVideo,
    endCall,
    localTracks: {
      videoTrack: localStreamRef.current?.getVideoTracks()[0] || null,
      audioTrack: localStreamRef.current?.getAudioTracks()[0] || null
    },
    remoteTracks: {
      videoTrack: remoteStreamRef.current?.getVideoTracks()[0] || null,
      audioTrack: remoteStreamRef.current?.getAudioTracks()[0] || null
    }
  };
};
