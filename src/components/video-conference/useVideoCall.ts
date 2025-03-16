
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAgoraVideo } from '@/hooks/useAgoraVideo';
import AgoraRTC, { ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

export const useVideoCall = (roomId: string) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  
  const agoraClientRef = useRef<any>(null);
  const localTracksRef = useRef<{
    audioTrack: IMicrophoneAudioTrack | null;
    videoTrack: ICameraVideoTrack | null;
  }>({
    audioTrack: null,
    videoTrack: null
  });
  
  const { generateToken, joinChannel, isLoading: isTokenLoading } = useAgoraVideo(roomId);

  // Initialize tracks and join the channel
  const initializeCall = async (localVideoRef: HTMLDivElement, remoteVideoRef: HTMLDivElement) => {
    try {
      setIsJoining(true);
      
      // Create local tracks (camera and microphone)
      const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localTracksRef.current = {
        audioTrack: microphoneTrack,
        videoTrack: cameraTrack
      };
      
      // Display local video
      if (localVideoRef && cameraTrack) {
        cameraTrack.play(localVideoRef);
      }
      
      // Generate a token for the Agora channel
      const uid = Math.floor(Math.random() * 100000).toString();
      const tokenData = await generateToken(uid);
      
      if (!tokenData) {
        throw new Error("Failed to generate Agora token");
      }
      
      // Join the Agora channel
      if (remoteVideoRef && localTracksRef.current.audioTrack && localTracksRef.current.videoTrack) {
        agoraClientRef.current = await joinChannel(
          localTracksRef.current.audioTrack,
          localTracksRef.current.videoTrack,
          remoteVideoRef
        );
        
        setIsConnected(true);
        toast({
          title: "Connected to room",
          description: `You've joined room: ${roomId}`,
        });
      }
    } catch (error: any) {
      console.error('Error initializing Agora:', error);
      toast({
        title: "Connection Error",
        description: error.message || "Could not connect to the video call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };
  
  // Toggle microphone
  const toggleMic = () => {
    if (localTracksRef.current.audioTrack) {
      if (isMicOn) {
        localTracksRef.current.audioTrack.setEnabled(false);
      } else {
        localTracksRef.current.audioTrack.setEnabled(true);
      }
      setIsMicOn(!isMicOn);
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localTracksRef.current.videoTrack) {
      if (isVideoOn) {
        localTracksRef.current.videoTrack.setEnabled(false);
      } else {
        localTracksRef.current.videoTrack.setEnabled(true);
      }
      setIsVideoOn(!isVideoOn);
    }
  };
  
  // End call
  const endCall = async () => {
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
    
    setIsConnected(false);
  };

  return {
    isConnected,
    isMicOn,
    isVideoOn,
    isJoining,
    localTracks: localTracksRef.current,
    initializeCall,
    toggleMic,
    toggleVideo,
    endCall
  };
};
