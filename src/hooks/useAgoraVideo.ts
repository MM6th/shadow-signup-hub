
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAgoraVideo = (appointmentId: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateToken = useCallback(async (uid: string) => {
    try {
      setIsLoading(true);
      
      // Generate a channel name based on the appointment ID
      const generatedChannelName = `appointment-${appointmentId}`;
      
      // Call our edge function to generate a token
      const { data, error } = await supabase.functions.invoke('generate-agora-token', {
        body: {
          channelName: generatedChannelName,
          uid: uid,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate Agora token');
      }

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

  // This is a placeholder function that you would implement with the actual Agora SDK
  const joinChannel = useCallback(async (localAudioTrack: any, localVideoTrack: any, remoteContainer: HTMLElement) => {
    console.log("Joining channel with:", { token, channelName, localAudioTrack, localVideoTrack, remoteContainer });
    
    // In a production environment, you would use the Agora Web SDK to join the channel
    // Example code (to be replaced with actual SDK implementation):
    // const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    // await client.join(appId, channelName, token, uid);
    // await client.publish([localAudioTrack, localVideoTrack]);
    
    return {
      leave: async () => {
        // Placeholder for leaving the channel
        console.log("Leaving channel:", channelName);
        // In a production environment:
        // await client.unpublish([localAudioTrack, localVideoTrack]);
        // await client.leave();
      }
    };
  }, [token, channelName]);

  return {
    isLoading,
    token,
    channelName,
    error,
    generateToken,
    joinChannel,
  };
};
