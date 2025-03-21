
import { useState, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAgoraTokenGeneration, TokenData } from './agora/useAgoraTokenGeneration';
import { useAgoraClient } from './agora/useAgoraClient';
import { useAgoraTracks, TracksRef } from './agora/useAgoraTracks';

interface UseAgoraVideoResult {
  isLoading: boolean;
  token: string | null;
  channelName: string | null;
  error: string | null;
  agoraClient: any | null;
  localAudioTrack: any | null;
  localVideoTrack: any | null;
  generateToken: (uid: string) => Promise<TokenData | null>;
  joinChannel: (agoraToken: string, agoraChannelName: string, uid: string | number) => Promise<any | undefined>;
  startLivestream: (uid: string) => Promise<void>;
  stopLivestream: () => Promise<void>;
}

export const useAgoraVideo = (appointmentId: string): UseAgoraVideoResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const isLivestreamingRef = useRef(false);
  const AGORA_APP_ID = 'fe3e46a0094f486b91a0e90ac8e4379a';

  // Use our new hooks
  const { 
    token, 
    channelName, 
    generateToken,
    setError: setTokenError
  } = useAgoraTokenGeneration(appointmentId);
  
  const {
    client: agoraClient,
    createClient,
    joinChannel: joinAgoraChannel,
    leaveChannel,
    unpublishTracks
  } = useAgoraClient(AGORA_APP_ID);

  const {
    localAudioTrack,
    localVideoTrack,
    createTracks,
    closeTracks
  } = useAgoraTracks();

  const joinChannel = useCallback(async (
    agoraToken: string,
    agoraChannelName: string,
    uid: string | number
  ) => {
    if (!localAudioTrack || !localVideoTrack) {
      console.error("Local tracks not initialized");
      setError("Audio and video tracks must be initialized before joining channel");
      return undefined;
    }
    
    try {
      const client = createClient();
      const tracks = [localAudioTrack, localVideoTrack];
      
      // Join channel and publish tracks
      return await joinAgoraChannel(agoraToken, agoraChannelName, uid, tracks);
    } catch (error: any) {
      console.error("Error joining Agora channel:", error);
      setError(`Failed to join Agora channel: ${error.message}`);
      setIsLoading(false);
      throw error;
    }
  }, [createClient, joinAgoraChannel, localAudioTrack, localVideoTrack, setError]);

  const startLivestream = useCallback(async (uid: string) => {
    setIsLoading(true);
    setError(null);

    try {
      createClient();

      const tokenData = await generateToken(uid);
      if (!tokenData || !tokenData.token || !tokenData.channelName) {
        throw new Error("Failed to generate token for livestream");
      }

      // Create local tracks
      await createTracks();

      // Join channel with the token
      await joinChannel(tokenData.token, tokenData.channelName, uid);
      console.log("Livestream started successfully");
      isLivestreamingRef.current = true;
      
    } catch (err: any) {
      console.error("Error starting livestream:", err);
      setError(err.message || "Failed to start livestream");
      setTokenError(err.message || "Failed to start livestream");
      
      await stopLivestream();
    } finally {
      setIsLoading(false);
    }
  }, [createClient, createTracks, generateToken, joinChannel, stopLivestream, setTokenError]);

  const stopLivestream = useCallback(async () => {
    try {
      if (isLivestreamingRef.current) {
        console.log("Stopping livestream...");
        
        const tracks = [];
        if (localAudioTrack) tracks.push(localAudioTrack);
        if (localVideoTrack) tracks.push(localVideoTrack);
        
        if (tracks.length > 0) {
          await unpublishTracks(tracks);
        }
        
        await leaveChannel();
        closeTracks();
        
        isLivestreamingRef.current = false;
      } else {
        console.log("No active livestream to stop");
      }
    } catch (err: any) {
      console.error("Error stopping livestream:", err);
      setError(`Failed to stop livestream: ${err.message}`);
    }
  }, [unpublishTracks, leaveChannel, closeTracks, localAudioTrack, localVideoTrack]);

  return {
    isLoading,
    token,
    channelName,
    error,
    agoraClient,
    localAudioTrack,
    localVideoTrack,
    generateToken,
    joinChannel,
    startLivestream,
    stopLivestream
  };
};
