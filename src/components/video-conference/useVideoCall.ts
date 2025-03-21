import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAgoraVideo } from '@/hooks/useAgoraVideo';
import AgoraRTC from 'agora-rtc-sdk-ng';

export const useVideoCall = (roomId: string) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const agoraClientRef = useRef<any>(null);
  const localTracksRef = useRef<{
    audioTrack: any | null;
    videoTrack: any | null;
  }>({
    audioTrack: null,
    videoTrack: null
  });
  
  const remoteTracksRef = useRef<{
    audioTrack: any | null;
    videoTrack: any | null;
  }>({
    audioTrack: null,
    videoTrack: null
  });
  
  const { generateToken, joinChannel, isLoading: isTokenLoading, error: tokenError } = useAgoraVideo(roomId);
  
  useEffect(() => {
    if (tokenError) {
      setConnectionError(tokenError);
    }
  }, [tokenError]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      console.log("Explicitly requesting camera and microphone permissions...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      console.log("Camera and microphone permissions granted successfully");
      
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionsGranted(true);
      toast({
        title: "Permissions granted",
        description: "Camera and microphone access allowed",
      });
      
      return true;
    } catch (err: any) {
      console.error("Permission error:", err);
      
      setPermissionsGranted(false);
      setConnectionError(`Permission error: ${err.message}`);
      toast({
        title: "Permission Error",
        description: err.message || "Failed to access camera and microphone",
        variant: "destructive",
      });
      
      return false;
    }
  }, [toast]);

  const initializeCall = async (localVideoRef: HTMLDivElement, remoteVideoRef: HTMLDivElement) => {
    try {
      setIsJoining(true);
      setConnectionError(null);
      console.log("Initializing call with room ID:", roomId);
      
      if (!permissionsGranted) {
        const granted = await requestPermissions();
        if (!granted) {
          throw new Error("Camera and microphone permissions are required");
        }
      }
      
      if (localTracksRef.current.audioTrack) {
        localTracksRef.current.audioTrack.close();
        localTracksRef.current.audioTrack = null;
      }
      
      if (localTracksRef.current.videoTrack) {
        localTracksRef.current.videoTrack.close();
        localTracksRef.current.videoTrack = null;
      }
      
      let microphoneTrack: any = null;
      let cameraTrack: any = null;
      
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
      
      if (localVideoRef && cameraTrack) {
        console.log("Playing local video track to element:", localVideoRef);
        try {
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
      
      const uid = Math.floor(Math.random() * 100000).toString();
      const tokenData = await generateToken(uid);
      
      if (!tokenData) {
        throw new Error("Failed to generate Agora token");
      }
      
      console.log("Token generated successfully:", tokenData.channelName);
      
      if (remoteVideoRef && localTracksRef.current.audioTrack && localTracksRef.current.videoTrack) {
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        
        client.on("connection-state-change", (curState: string, prevState: string) => {
          console.log(`Client connection state changed from ${prevState} to ${curState}`);
          if (curState === "CONNECTED") {
            setIsConnected(true);
            setConnectionError(null);
          } else if (curState === "DISCONNECTED") {
            setIsConnected(false);
            setConnectionError(`Connection state: ${curState}`);
          }
        });
        
        client.on("token-privilege-did-expire", async () => {
          console.log("Token expired, refreshing...");
          try {
            const newTokenData = await generateToken(uid);
            if (newTokenData) {
              await client.renewToken(newTokenData.token);
              console.log("Token renewed successfully");
            }
          } catch (err) {
            console.error("Failed to renew token:", err);
            setConnectionError("Token expired and renewal failed");
          }
        });
        
        client.on('user-published', async (user: any, mediaType: 'audio' | 'video') => {
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
        
        client.on('user-unpublished', (user: any, mediaType: string) => {
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
            tokenData.token,
            tokenData.channelName,
            uid
          );
          
          setIsConnected(true);
          setConnectionError(null);
          toast({
            title: "Connected to room",
            description: `You've joined room: ${roomId}`,
          });
        } catch (joinErr: any) {
          console.error("Error joining channel:", joinErr);
          setConnectionError(`Failed to join channel: ${joinErr.message}`);
          throw new Error(`Failed to join channel: ${joinErr.message}`);
        }
      }
    } catch (error: any) {
      console.error('Error initializing Agora:', error);
      setConnectionError(error.message || "Connection failed");
      toast({
        title: "Connection Error",
        description: error.message || "Could not connect to the video call. Please try again.",
        variant: "destructive",
      });
      
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
  
  const endCall = useCallback(async () => {
    try {
      if (agoraClientRef.current) {
        await agoraClientRef.current.leave();
      }
      
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
    connectionError,
    localTracks: localTracksRef.current,
    remoteTracks: remoteTracksRef.current,
    initializeCall,
    requestPermissions,
    toggleMic,
    toggleVideo,
    endCall
  };
};
