import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import AgoraRTC, { 
  IAgoraRTCClient, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack, 
  IRemoteVideoTrack, 
  IRemoteAudioTrack 
} from 'agora-rtc-sdk-ng';
import { supabase } from '@/integrations/supabase/client';

interface WebRTCState {
  isConnected: boolean;
  isAudioOn: boolean;
  isVideoOn: boolean;
  isJoining: boolean;
  permissionsGranted: boolean;
}

interface LocalTracks {
  audioTrack: IMicrophoneAudioTrack | null;
  videoTrack: ICameraVideoTrack | null;
}

interface RemoteTracks {
  audioTrack: IRemoteAudioTrack | null;
  videoTrack: IRemoteVideoTrack | null;
}

export const useWebRTC = (roomId: string) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  
  const agoraClientRef = useRef<IAgoraRTCClient | null>(null);
  const localTracksRef = useRef<LocalTracks>({
    audioTrack: null,
    videoTrack: null
  });
  
  const remoteTracksRef = useRef<RemoteTracks>({
    audioTrack: null,
    videoTrack: null
  });
  
  // Request permissions explicitly
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      console.log("useWebRTC: Explicitly requesting camera and microphone permissions...");
      
      // This will trigger the browser permission dialog
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      console.log("useWebRTC: Camera and microphone permissions granted successfully");
      
      // Don't stop the stream right away - keep it referenced for a moment
      // to ensure the permissions remain granted
      setTimeout(() => {
        // Now we can safely stop all tracks
        stream.getTracks().forEach(track => track.stop());
      }, 500);
      
      setPermissionsGranted(true);
      toast({
        title: "Permissions granted",
        description: "Camera and microphone access allowed",
      });
      
      return true;
    } catch (err: any) {
      console.error("useWebRTC: Permission error:", err);
      
      setPermissionsGranted(false);
      toast({
        title: "Permission Error",
        description: err.message || "Failed to access camera and microphone",
        variant: "destructive",
      });
      
      return false;
    }
  }, [toast]);

  // Initialize tracks and set up for video call
  const initializeCall = async (localVideoRef: HTMLDivElement, remoteVideoRef: HTMLDivElement) => {
    try {
      setIsJoining(true);
      console.log("useWebRTC: Initializing call with room ID:", roomId);
      
      // Check if permissions already granted or request them
      if (!permissionsGranted) {
        const granted = await requestPermissions();
        if (!granted) {
          throw new Error("Camera and microphone permissions are required");
        }
      }
      
      // Release any existing tracks first
      if (localTracksRef.current.audioTrack) {
        localTracksRef.current.audioTrack.close();
        localTracksRef.current.audioTrack = null;
      }
      
      if (localTracksRef.current.videoTrack) {
        localTracksRef.current.videoTrack.close();
        localTracksRef.current.videoTrack = null;
      }
      
      // Create local tracks with more robust error handling
      let microphoneTrack: IMicrophoneAudioTrack | null = null;
      let cameraTrack: ICameraVideoTrack | null = null;
      
      try {
        console.log("useWebRTC: Creating microphone and camera tracks...");
        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks(
          {
            AEC: true,
            AGC: true,
            ANS: true
          },
          {
            encoderConfig: {
              width: 640,
              height: 360,
              frameRate: 15,
              bitrateMin: 400,
              bitrateMax: 800
            }
          }
        );
        
        microphoneTrack = tracks[0];
        cameraTrack = tracks[1];
        
        console.log("useWebRTC: Tracks created successfully:", { 
          audioTrackId: microphoneTrack?.getTrackId(),
          videoTrackId: cameraTrack?.getTrackId()
        });
      } catch (err: any) {
        console.error("useWebRTC: Error creating tracks:", err);
        if (err.name === "NotAllowedError" || err.message?.includes("Permission")) {
          throw new Error("Camera or microphone permission denied. Please check your browser settings.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          throw new Error("No camera or microphone found. Please connect devices and try again.");
        } else {
          throw new Error(`Failed to access media devices: ${err.message}`);
        }
      }
      
      localTracksRef.current = {
        audioTrack: microphoneTrack,
        videoTrack: cameraTrack
      };
      
      // Display local video
      if (localVideoRef && cameraTrack) {
        console.log("useWebRTC: Playing local video track to element:", localVideoRef);
        try {
          // Set a timeout to ensure DOM is ready
          await cameraTrack.play(localVideoRef);
          console.log("useWebRTC: Local video track played successfully");
        } catch (playErr) {
          console.error("useWebRTC: Error playing local video track:", playErr);
        }
      } else {
        console.warn("useWebRTC: Cannot play local video track - reference or track is null", {
          hasLocalVideoRef: !!localVideoRef,
          hasCameraTrack: !!cameraTrack
        });
      }
      
      // Generate a token for the Agora channel
      console.log("useWebRTC: Generating Agora token...");
      const uid = Math.floor(Math.random() * 100000).toString();
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-agora-token', {
          body: {
            channelName: `livestream-${roomId}`,
            uid: uid,
          },
        });
        
        if (error) {
          console.error("Error from generate-agora-token function:", error);
          throw new Error(error.message || 'Failed to generate Agora token');
        }
        
        if (!data || !data.token) {
          console.error("No token data returned from function:", data);
          throw new Error('Invalid token data received');
        }
        
        console.log("useWebRTC: Token generated successfully:", {
          channelName: data.channelName,
          uid: data.uid,
          tokenLength: data.token.length,
        });
        
        setToken(data.token);
        setChannelName(data.channelName);
        
        // Create Agora client
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        agoraClientRef.current = client;
        
        // Set up user-published handler - this is critical for seeing remote users
        client.on('user-published', async (user, mediaType) => {
          console.log(`useWebRTC: Remote user ${user.uid} published ${mediaType} track`);
          
          try {
            // Subscribe to the remote user
            await client.subscribe(user, mediaType);
            console.log(`useWebRTC: Subscribed to ${mediaType} track from user ${user.uid}`);
            
            if (mediaType === 'video') {
              remoteTracksRef.current.videoTrack = user.videoTrack;
              if (user.videoTrack && remoteVideoRef) {
                console.log("useWebRTC: Playing remote video track to element");
                try {
                  user.videoTrack.play(remoteVideoRef);
                  console.log("useWebRTC: Remote video track played successfully");
                } catch (playErr) {
                  console.error("useWebRTC: Error playing remote video track:", playErr);
                }
              }
            }
            
            if (mediaType === 'audio') {
              remoteTracksRef.current.audioTrack = user.audioTrack;
              if (user.audioTrack) {
                console.log("useWebRTC: Playing remote audio track");
                try {
                  user.audioTrack.play();
                  console.log("useWebRTC: Remote audio track played successfully");
                } catch (playErr) {
                  console.error("useWebRTC: Error playing remote audio track:", playErr);
                }
              }
            }
            
            // Important: Set connected state when we have a remote user
            setIsConnected(true);
          } catch (subscribeErr) {
            console.error(`useWebRTC: Failed to subscribe to ${mediaType}:`, subscribeErr);
          }
        });
        
        client.on('user-unpublished', (user, mediaType) => {
          console.log(`useWebRTC: Remote user ${user.uid} unpublished ${mediaType} track`);
          if (mediaType === 'video') {
            remoteTracksRef.current.videoTrack = null;
          }
          if (mediaType === 'audio') {
            remoteTracksRef.current.audioTrack = null;
          }
        });
        
        client.on('user-left', (user) => {
          console.log(`useWebRTC: Remote user ${user.uid} left the channel`);
          remoteTracksRef.current.videoTrack = null;
          remoteTracksRef.current.audioTrack = null;
          // If the remote user left, we're no longer connected
          setIsConnected(false);
        });
      } catch (tokenErr) {
        console.error("useWebRTC: Error generating token:", tokenErr);
        throw new Error(`Failed to generate token: ${tokenErr.message}`);
      }
    } catch (error: any) {
      console.error('useWebRTC: Error initializing Agora:', error);
      toast({
        title: "Connection Error",
        description: error.message || "Could not connect to the video call. Please try again.",
        variant: "destructive",
      });
      
      // Clean up any tracks we might have created before the error
      if (localTracksRef.current.audioTrack) {
        localTracksRef.current.audioTrack.close();
        localTracksRef.current.audioTrack = null;
      }
      
      if (localTracksRef.current.videoTrack) {
        localTracksRef.current.videoTrack.close();
        localTracksRef.current.videoTrack = null;
      }
      
      throw error;
    } finally {
      setIsJoining(false);
    }
  };
  
  // Make the actual call by joining the channel
  const makeCall = useCallback(async () => {
    if (!agoraClientRef.current || !token || !channelName || !localTracksRef.current.audioTrack || !localTracksRef.current.videoTrack) {
      console.error("useWebRTC: Cannot make call - prerequisites not met:", {
        hasClient: !!agoraClientRef.current,
        hasToken: !!token,
        hasChannelName: !!channelName,
        hasAudioTrack: !!localTracksRef.current.audioTrack,
        hasVideoTrack: !!localTracksRef.current.videoTrack
      });
      toast({
        title: "Connection Error",
        description: "Could not establish call. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsJoining(true);
      console.log("useWebRTC: Joining channel:", channelName);
      
      // Join the channel
      const client = agoraClientRef.current;
      await client.join(
        '0763309372ab4637918e71cb13f52323', // Agora App ID
        channelName,
        token,
        null // Use null for a random UID, or specify a number
      );
      
      console.log('useWebRTC: Successfully joined channel');
      
      // Publish local tracks
      console.log("useWebRTC: Publishing local tracks...");
      try {
        await client.publish([localTracksRef.current.audioTrack, localTracksRef.current.videoTrack]);
        console.log('useWebRTC: Local tracks published successfully');
        setIsConnected(true);
        toast({
          title: "Connected to room",
          description: `You've joined room: ${roomId}`,
        });
      } catch (publishError) {
        console.error("useWebRTC: Error publishing tracks, retrying:", publishError);
        // Wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        await client.publish([localTracksRef.current.audioTrack, localTracksRef.current.videoTrack]);
        console.log('useWebRTC: Local tracks published successfully on retry');
        setIsConnected(true);
      }
    } catch (error: any) {
      console.error('useWebRTC: Error making call:', error);
      toast({
        title: "Connection Error",
        description: error.message || "Could not connect to the video call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  }, [roomId, token, channelName, toast]);
  
  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (localTracksRef.current.audioTrack) {
      if (isAudioOn) {
        localTracksRef.current.audioTrack.setEnabled(false);
      } else {
        localTracksRef.current.audioTrack.setEnabled(true);
      }
      setIsAudioOn(!isAudioOn);
    }
  }, [isAudioOn]);
  
  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localTracksRef.current.videoTrack) {
      if (isVideoOn) {
        localTracksRef.current.videoTrack.setEnabled(false);
      } else {
        localTracksRef.current.videoTrack.setEnabled(true);
      }
      setIsVideoOn(!isVideoOn);
    }
  }, [isVideoOn]);
  
  // End call
  const endCall = useCallback(async () => {
    try {
      // Leave the Agora channel
      if (agoraClientRef.current) {
        await agoraClientRef.current.leave();
      }
      
      // Close and release local tracks
      if (localTracksRef.current.audioTrack) {
        localTracksRef.current.audioTrack.close();
      }
      if (localTracksRef.current.videoTrack) {
        localTracksRef.current.videoTrack.close();
      }
      
      localTracksRef.current = {
        audioTrack: null,
        videoTrack: null
      };
      
      remoteTracksRef.current = {
        audioTrack: null,
        videoTrack: null
      };
      
      setIsConnected(false);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // endCall will handle cleanup
      if (isConnected) {
        endCall();
      }
    };
  }, [isConnected, endCall]);

  return {
    isConnected,
    isAudioOn,
    isVideoOn,
    isJoining,
    permissionsGranted,
    localTracks: localTracksRef.current,
    remoteTracks: remoteTracksRef.current,
    initializeCall,
    makeCall, // Now exposed to the component
    requestPermissions,
    toggleMic,
    toggleVideo,
    endCall
  };
};
