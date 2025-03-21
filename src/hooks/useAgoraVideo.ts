
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AgoraRTC, { IAgoraRTCClient, ILocalAudioTrack, ILocalVideoTrack } from 'agora-rtc-sdk-ng';

interface TokenData {
  token: string;
  channelName: string;
  uid: string;
  expirationTimeInSeconds: number;
}

export const useAgoraVideo = (appointmentId: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateToken = useCallback(async (uid: string): Promise<TokenData | null> => {
    try {
      setIsLoading(true);
      
      // Generate a channel name based on the appointment ID
      const generatedChannelName = `livestream-${appointmentId}`;
      
      console.log("Generating token for channel:", generatedChannelName, "with UID:", uid);
      
      // First, get the current session to ensure we have a valid auth token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        throw new Error('Authentication error: ' + sessionError.message);
      }
      
      if (!sessionData.session) {
        console.error("No active session found");
        throw new Error('You must be logged in to generate a token');
      }
      
      // Call our edge function to generate a token with proper authentication
      const { data, error } = await supabase.functions.invoke('generate-agora-token', {
        body: {
          channelName: generatedChannelName,
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

      console.log("Successfully generated token:", {
        channelName: data.channelName,
        uid: data.uid,
        tokenLength: data.token.length,
      });

      setToken(data.token);
      setChannelName(data.channelName);
      return data;
    } catch (err: any) {
      console.error('Error generating Agora token:', err);
      setError(err.message || 'Failed to generate Agora token');
      toast({
        title: "Error",
        description: err.message || 'Failed to generate Agora token',
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, toast]);

  // Initialize and join Agora channel
  const joinChannel = useCallback(async (
    client: IAgoraRTCClient,
    localAudioTrack: ILocalAudioTrack, 
    localVideoTrack: ILocalVideoTrack,
    agoraToken: string,
    agoraChannelName: string
  ) => {
    try {
      console.log("Joining channel with:", { 
        tokenProvided: !!agoraToken, 
        channelName: agoraChannelName,
        tokenLength: agoraToken.length
      });
      
      // Join the channel
      const uid = await client.join(
        '0763309372ab4637918e71cb13f52323', // Agora App ID
        agoraChannelName,
        agoraToken,
        null // Use null for a random UID, or specify a number
      );
      
      console.log('Joined channel with UID:', uid);
      
      // Publish local tracks with retry logic
      console.log("Publishing local tracks...");
      try {
        await client.publish([localAudioTrack, localVideoTrack]);
        console.log('Local tracks published successfully');
      } catch (publishError) {
        console.error("Error publishing tracks, retrying:", publishError);
        // Wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        await client.publish([localAudioTrack, localVideoTrack]);
        console.log('Local tracks published successfully on retry');
      }
      
      // Return client for later use
      return client;
    } catch (error) {
      console.error("Error joining Agora channel:", error);
      throw error;
    }
  }, []);

  return {
    isLoading,
    token,
    channelName,
    error,
    generateToken,
    joinChannel,
  };
};
