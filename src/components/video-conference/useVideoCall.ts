
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
        // Set up user-published handler
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        
        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          
          if (mediaType === 'video') {
            remoteTracksRef.current.videoTrack = user.videoTrack;
            if (user.videoTrack) {
              user.videoTrack.play(remoteVideoRef);
            }
          }
          
          if (mediaType === 'audio') {
            remoteTracksRef.current.audioTrack = user.audioTrack;
            if (user.audioTrack) {
              user.audioTrack.play();
            }
          }
        });
        
        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video') {
            remoteTracksRef.current.videoTrack = null;
          }
          if (mediaType === 'audio') {
            remoteTracksRef.current.audioTrack = null;
          }
        });
        
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
    localTracks: localTracksRef.current,
    remoteTracks: remoteTracksRef.current,
    initializeCall,
    toggleMic,
    toggleVideo,
    endCall
  };
};
