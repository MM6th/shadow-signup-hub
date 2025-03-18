import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAgoraVideo } from '@/hooks/useAgoraVideo';
import AgoraRTC, { ICameraVideoTrack, IMicrophoneAudioTrack, IRemoteVideoTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';

export const useVideoCall = (roomId: string) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  
  const agoraClientRef = useRef<any>(null);
  const localTracksRef = useRef<{
    audioTrack: IMicrophoneAudioTrack | null;
    videoTrack: ICameraVideoTrack | null;
  }>({
    audioTrack: null,
    videoTrack: null
  });
  
  const remoteTracksRef = useRef<{
    audioTrack: IRemoteAudioTrack | null;
    videoTrack: IRemoteVideoTrack | null;
  }>({
    audioTrack: null,
    videoTrack: null
  });
  
  const { generateToken, joinChannel, isLoading: isTokenLoading } = useAgoraVideo(roomId);

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
      
      // Important: Don't stop the stream right away - keep it referenced
      // We'll need to properly handle this when creating Agora tracks
      
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

  // Initialize tracks and join the channel
  const initializeCall = async (localVideoRef: HTMLDivElement, remoteVideoRef: HTMLDivElement) => {
    try {
      setIsJoining(true);
      console.log("Initializing call with room ID:", roomId);
      
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
        console.log("Creating microphone and camera tracks...");
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
        
        console.log("Tracks created successfully:", { 
          audioTrackId: microphoneTrack?.getTrackId(),
          videoTrackId: cameraTrack?.getTrackId()
        });
      } catch (err: any) {
        console.error("Error creating tracks:", err);
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
        console.log("Playing local video track to element:", localVideoRef);
        try {
          // Set a timeout to ensure DOM is ready
          setTimeout(async () => {
            if (cameraTrack && localVideoRef) {
              try {
                await cameraTrack.play(localVideoRef);
                console.log("Local video track played successfully");
              } catch (playErr) {
                console.error("Error playing local video track:", playErr);
              }
            }
          }, 100);
        } catch (playErr) {
          console.error("Error playing local video track:", playErr);
        }
      } else {
        console.warn("Cannot play local video track - reference or track is null", {
          hasLocalVideoRef: !!localVideoRef,
          hasCameraTrack: !!cameraTrack
        });
      }
      
      // Generate a token for the Agora channel
      console.log("Generating Agora token...");
      const uid = Math.floor(Math.random() * 100000).toString();
      const tokenData = await generateToken(uid);
      
      if (!tokenData) {
        throw new Error("Failed to generate Agora token");
      }
      
      console.log("Token generated successfully:", tokenData.channelName);
      
      // Join the Agora channel
      if (remoteVideoRef && localTracksRef.current.audioTrack && localTracksRef.current.videoTrack) {
        // Set up user-published handler
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        
        client.on('user-published', async (user, mediaType) => {
          console.log(`Remote user ${user.uid} published ${mediaType} track`);
          await client.subscribe(user, mediaType);
          
          if (mediaType === 'video') {
            remoteTracksRef.current.videoTrack = user.videoTrack;
            if (user.videoTrack) {
              console.log("Playing remote video track");
              try {
                user.videoTrack.play(remoteVideoRef);
                console.log("Remote video track played successfully");
              } catch (playErr) {
                console.error("Error playing remote video track:", playErr);
              }
            }
          }
          
          if (mediaType === 'audio') {
            remoteTracksRef.current.audioTrack = user.audioTrack;
            if (user.audioTrack) {
              console.log("Playing remote audio track");
              try {
                user.audioTrack.play();
                console.log("Remote audio track played successfully");
              } catch (playErr) {
                console.error("Error playing remote audio track:", playErr);
              }
            }
          }
        });
        
        client.on('user-unpublished', (user, mediaType) => {
          console.log(`Remote user ${user.uid} unpublished ${mediaType} track`);
          if (mediaType === 'video') {
            remoteTracksRef.current.videoTrack = null;
          }
          if (mediaType === 'audio') {
            remoteTracksRef.current.audioTrack = null;
          }
        });
        
        console.log("Joining channel:", tokenData.channelName);
        try {
          agoraClientRef.current = await joinChannel(
            client,
            localTracksRef.current.audioTrack,
            localTracksRef.current.videoTrack,
            tokenData.token,
            tokenData.channelName
          );
          
          setIsConnected(true);
          toast({
            title: "Connected to room",
            description: `You've joined room: ${roomId}`,
          });
        } catch (joinErr: any) {
          console.error("Error joining channel:", joinErr);
          throw new Error(`Failed to join channel: ${joinErr.message}`);
        }
      }
    } catch (error: any) {
      console.error('Error initializing Agora:', error);
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
  
  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (localTracksRef.current.audioTrack) {
      if (isMicOn) {
        localTracksRef.current.audioTrack.setEnabled(false);
      } else {
        localTracksRef.current.audioTrack.setEnabled(true);
      }
      setIsMicOn(!isMicOn);
    }
  }, [isMicOn]);
  
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
      endCall();
    };
  }, [endCall]);

  return {
    isConnected,
    isMicOn,
    isVideoOn,
    isJoining,
    permissionsGranted,
    localTracks: localTracksRef.current,
    remoteTracks: remoteTracksRef.current,
    initializeCall,
    requestPermissions,
    toggleMic,
    toggleVideo,
    endCall
  };
};
