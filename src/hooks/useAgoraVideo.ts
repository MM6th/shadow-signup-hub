import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AgoraRTC, { IAgoraRTCClient, ILocalAudioTrack, ILocalVideoTrack, ConnectionState } from 'agora-rtc-sdk-ng';

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
      
      const generatedChannelName = `livestream-${appointmentId}`;
      
      console.log("Generating token for channel:", generatedChannelName, "with UID:", uid);
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        throw new Error('Authentication error: ' + sessionError.message);
      }
      
      if (!sessionData.session) {
        console.error("No active session found");
        throw new Error('You must be logged in to generate a token');
      }
      
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
      
      client.on("connection-state-change", (curState, prevState) => {
        console.log("Connection state changed from", prevState, "to", curState);
        
        if (curState === "CONNECTED") {
          setIsLoading(false);
          setError(null);
        } else if (curState === "DISCONNECTED") {
          setError(`Connection failed: ${curState}`);
          setIsLoading(false);
        }
      });
      
      console.log("Attempting to join Agora channel...");
      
      const joinWithTimeout = async () => {
        return new Promise<number>(async (resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Timeout: Failed to join Agora channel after 15 seconds"));
          }, 15000);
          
          try {
            // Convert the provided UID to a number if possible, otherwise use null
            // This ensures we're passing the correct type to client.join
            let uidToUse: number | null = null;
            
            // For Agora SDK, we need a number UID, not a string
            // Parse the UID from a string to a number
            if (typeof client.uid === 'string') {
              const parsedUid = parseInt(client.uid, 10);
              if (!isNaN(parsedUid)) {
                uidToUse = parsedUid;
              }
            }
            
            console.log("Joining with UID:", uidToUse);
            
            // Now pass the properly typed UID to the join method
            const joinedUid = await client.join(
              'fe3e46a0094f486b91a0e90ac8e4379a',
              agoraChannelName,
              agoraToken,
              uidToUse
            );
            clearTimeout(timeout);
            resolve(joinedUid);
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });
      };
      
      const uid = await joinWithTimeout();
      console.log('Joined channel with UID:', uid);
      
      console.log("Publishing local tracks...");
      try {
        await client.publish([localAudioTrack, localVideoTrack]);
        console.log('Local tracks published successfully');
      } catch (publishError) {
        console.error("Error publishing tracks, retrying:", publishError);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await client.publish([localAudioTrack, localVideoTrack]);
        console.log('Local tracks published successfully on retry');
      }
      
      return client;
    } catch (error: any) {
      console.error("Error joining Agora channel:", error);
      setError(`Failed to join Agora channel: ${error.message}`);
      setIsLoading(false);
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
