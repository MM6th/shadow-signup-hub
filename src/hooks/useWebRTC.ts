
import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  
  // Signaling channel using Supabase Realtime
  const channel = useRef<any>(null);
  
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
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ]
    });
    
    console.log("Created peer connection with ICE servers");
    
    // Set up event handlers
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Generated ICE candidate:", event.candidate);
        
        // Send the ICE candidate to the remote peer via Supabase Realtime
        if (channel.current) {
          channel.current.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: {
              candidate: event.candidate,
              roomId
            }
          });
        }
      }
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        console.log("ICE connection established!");
        setIsConnected(true);
      } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
        console.log("ICE connection failed or disconnected:", pc.iceConnectionState);
        setIsConnected(false);
      }
    };
    
    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      
      // Add the remote track to our remote stream
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }
      
      remoteStreamRef.current.addTrack(event.track);
      setIsConnected(true);
      
      // Display the remote stream in the container
      if (remoteVideoContainerRef.current) {
        console.log("Attempting to display remote video in container");
        updateRemoteVideoDisplay();
      }
      
      toast({
        title: "Connected",
        description: "Remote user has joined the call",
      });
    };
    
    peerConnection.current = pc;
    return pc;
  }, [roomId, toast]);
  
  // Function to update the remote video display
  const updateRemoteVideoDisplay = useCallback(() => {
    if (!remoteStreamRef.current || !remoteVideoContainerRef.current) return;
    
    // Create a video element if needed
    const existingVideo = remoteVideoContainerRef.current.querySelector('video');
    if (existingVideo) {
      existingVideo.srcObject = remoteStreamRef.current;
    } else {
      const video = document.createElement('video');
      video.srcObject = remoteStreamRef.current;
      video.autoplay = true;
      video.playsInline = true;
      video.style.width = '100%';
      video.style.height = '100%';
      
      remoteVideoContainerRef.current.innerHTML = '';
      remoteVideoContainerRef.current.appendChild(video);
      
      video.onloadedmetadata = () => {
        video.play().catch(e => console.error("Error playing remote video:", e));
      };
    }
  }, []);
  
  // Set up the signaling channel
  const setupSignalingChannel = useCallback(() => {
    if (channel.current) {
      channel.current.unsubscribe();
    }
    
    const roomChannel = supabase.channel(`livestream-${roomId}`, {
      config: {
        broadcast: { self: false },
      },
    });
    
    console.log(`Setting up signaling channel: livestream-${roomId}`);
    
    roomChannel
      .on('broadcast', { event: 'offer' }, async (payload) => {
        console.log("Received offer:", payload);
        if (payload.payload.roomId !== roomId) return;
        
        if (!peerConnection.current) {
          console.log("Initializing peer connection after receiving offer");
          initializePeerConnection();
        }
        
        if (peerConnection.current) {
          try {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.payload.offer));
            console.log("Set remote description from offer");
            
            // Create and send answer
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            console.log("Created answer and set local description");
            
            roomChannel.send({
              type: 'broadcast',
              event: 'answer',
              payload: {
                answer,
                roomId
              }
            });
            
            console.log("Sent answer to offerer");
          } catch (err) {
            console.error("Error handling offer:", err);
          }
        }
      })
      .on('broadcast', { event: 'answer' }, async (payload) => {
        console.log("Received answer:", payload);
        if (payload.payload.roomId !== roomId) return;
        
        if (peerConnection.current) {
          try {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.payload.answer));
            console.log("Set remote description from answer");
          } catch (err) {
            console.error("Error handling answer:", err);
          }
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async (payload) => {
        console.log("Received ICE candidate:", payload);
        if (payload.payload.roomId !== roomId) return;
        
        if (peerConnection.current) {
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.payload.candidate));
            console.log("Added received ICE candidate");
          } catch (err) {
            console.error("Error handling ICE candidate:", err);
          }
        }
      })
      .on('broadcast', { event: 'user-joined' }, (payload) => {
        console.log("User joined notification:", payload);
        toast({
          title: "User joined",
          description: "Someone has joined your livestream",
        });
      })
      .on('broadcast', { event: 'user-left' }, () => {
        console.log("User left notification");
        setIsConnected(false);
        toast({
          title: "User left",
          description: "Remote user has left the call",
        });
      })
      .subscribe((status) => {
        console.log(`Signaling channel status: ${status}`, roomChannel.state);
        if (status === 'SUBSCRIBED') {
          // Notify others that you've joined (useful for UI updates)
          roomChannel.send({
            type: 'broadcast',
            event: 'user-joined',
            payload: {
              roomId,
              timestamp: new Date().toISOString()
            }
          });
        }
      });
    
    channel.current = roomChannel;
    return roomChannel;
  }, [roomId, initializePeerConnection, toast]);
  
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
      
      // Setup signaling channel
      const signalChannel = setupSignalingChannel();
      
      console.log("Local stream obtained, ready for call initialization");
      
      // Display local video
      if (localStreamRef.current && localVideoElement) {
        const tracks = localStreamRef.current.getTracks();
        console.log(`Local stream has ${tracks.length} tracks:`, 
          tracks.map(t => ({ kind: t.kind, id: t.id, enabled: t.enabled })));
        
        const video = document.createElement('video');
        video.srcObject = localStreamRef.current;
        video.autoplay = true;
        video.muted = true; // Mute local video to prevent feedback
        video.playsInline = true;
        video.style.width = '100%';
        video.style.height = '100%';
        
        localVideoElement.innerHTML = '';
        localVideoElement.appendChild(video);
        
        video.onloadedmetadata = () => {
          video.play().catch(e => console.error("Error playing local video:", e));
        };
      }
      
      toast({
        title: "Ready to connect",
        description: "Camera and microphone are ready for the call",
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
  
  // Initiate a call (create and send an offer)
  const makeCall = async () => {
    if (!localStreamRef.current) {
      toast({
        title: "Error",
        description: "Cannot make call - camera and microphone not available",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Initialize peer connection
      const pc = initializePeerConnection();
      
      // Add local tracks to the peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          if (localStreamRef.current) {
            console.log(`Adding local ${track.kind} track to peer connection`);
            pc.addTrack(track, localStreamRef.current);
          }
        });
      }
      
      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("Created offer and set local description");
      
      // Send the offer via the signaling channel
      if (channel.current) {
        channel.current.send({
          type: 'broadcast',
          event: 'offer',
          payload: {
            offer,
            roomId
          }
        });
        console.log("Sent offer via signaling channel");
      }
      
      toast({
        title: "Calling",
        description: "Waiting for others to join...",
      });
    } catch (err) {
      console.error('Error making call:', err);
      toast({
        title: "Call Error",
        description: "Failed to initialize the call. Please try again.",
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
          console.log(`Microphone ${enabled ? 'unmuted' : 'muted'}`);
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
          console.log(`Camera ${enabled ? 'turned on' : 'turned off'}`);
        });
        setIsVideoOn(enabled);
      }
    }
  }, [isVideoOn]);
  
  // End call
  const endCall = useCallback(() => {
    try {
      // Notify other users that you're leaving
      if (channel.current) {
        channel.current.send({
          type: 'broadcast',
          event: 'user-left',
          payload: {
            roomId,
            timestamp: new Date().toISOString()
          }
        });
        
        // Unsubscribe from channel
        channel.current.unsubscribe();
        channel.current = null;
      }
      
      // Close the peer connection
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      
      // Stop all local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped ${track.kind} track`);
        });
        localStreamRef.current = null;
      }
      
      // Clear the remote stream
      remoteStreamRef.current = null;
      
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
      
      console.log("Call ended and resources cleaned up");
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, [roomId]);
  
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
