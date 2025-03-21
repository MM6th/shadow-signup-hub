
import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAgoraVideo } from '@/hooks/useAgoraVideo';
import { createLocalTracks, cleanupTracks, toggleTrackEnabled, playVideoTrack, TracksRef } from './utils/agoraTracksManager';
import { useMediaPermissions } from './utils/mediaPermissions';
import { setupClientEvents, createAgoraClient } from './utils/agoraClientManager';

export const useVideoCall = (roomId: string) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const agoraClientRef = useRef<any>(null);
  const localTracksRef = useRef<TracksRef>({
    audioTrack: null,
    videoTrack: null
  });
  
  const remoteTracksRef = useRef<TracksRef>({
    audioTrack: null,
    videoTrack: null
  });
  
  const { generateToken, joinChannel, isLoading: isTokenLoading, error: tokenError } = useAgoraVideo(roomId);
  const { requestPermissions: requestMediaPermissions } = useMediaPermissions();
  
  useEffect(() => {
    if (tokenError) {
      setConnectionError(tokenError);
    }
  }, [tokenError]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestMediaPermissions();
      setPermissionsGranted(granted);
      return granted;
    } catch (err: any) {
      console.error("Permission error:", err);
      setPermissionsGranted(false);
      setConnectionError(`Permission error: ${err.message}`);
      return false;
    }
  }, [requestMediaPermissions]);

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
      
      // Cleanup any existing tracks
      cleanupTracks(localTracksRef.current);
      
      // Create new tracks
      try {
        const { microphoneTrack, cameraTrack } = await createLocalTracks();
        
        localTracksRef.current = {
          audioTrack: microphoneTrack,
          videoTrack: cameraTrack
        };
        
        // Play local video track
        if (localVideoRef && cameraTrack) {
          console.log("Playing local video track to element:", localVideoRef);
          try {
            setTimeout(async () => {
              if (cameraTrack && localVideoRef) {
                await playVideoTrack(cameraTrack, localVideoRef);
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
      } catch (err) {
        throw err; // Let higher level handle the track creation errors
      }
      
      const uid = Math.floor(Math.random() * 100000).toString();
      const tokenData = await generateToken(uid);
      
      if (!tokenData) {
        throw new Error("Failed to generate Agora token");
      }
      
      console.log("Token generated successfully:", tokenData.channelName);
      
      if (remoteVideoRef && localTracksRef.current.audioTrack && localTracksRef.current.videoTrack) {
        // Create and setup the client
        const client = createAgoraClient();
        setupClientEvents(client, setIsConnected, setConnectionError, remoteTracksRef, remoteVideoRef);
        
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
      
      cleanupTracks(localTracksRef.current);
      
      throw error;
    } finally {
      setIsJoining(false);
    }
  };
  
  const toggleMic = useCallback(() => {
    if (toggleTrackEnabled(localTracksRef.current.audioTrack, !isMicOn)) {
      setIsMicOn(!isMicOn);
    }
  }, [isMicOn]);
  
  const toggleVideo = useCallback(() => {
    if (toggleTrackEnabled(localTracksRef.current.videoTrack, !isVideoOn)) {
      setIsVideoOn(!isVideoOn);
    }
  }, [isVideoOn]);
  
  const endCall = useCallback(async () => {
    try {
      if (agoraClientRef.current) {
        await agoraClientRef.current.leave();
      }
      
      cleanupTracks(localTracksRef.current);
      
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
