
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, ILocalAudioTrack, ILocalVideoTrack } from 'agora-rtc-sdk-ng';

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

  // Initialize Agora client
  const joinChannel = useCallback(async (localAudioTrack: ILocalAudioTrack, localVideoTrack: ILocalVideoTrack, remoteContainer: HTMLElement) => {
    if (!token || !channelName) {
      console.error("Token or channel name is missing");
      return {
        leave: async () => { console.log("Cannot leave: not connected"); }
      };
    }

    console.log("Joining channel with:", { token, channelName });
    
    try {
      // Create an Agora client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      
      // Listen for remote users joining
      client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        // Subscribe to the remote user
        await client.subscribe(user, mediaType);
        
        // If the remote user published a video track, play it in the container
        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack;
          if (remoteVideoTrack) {
            // Create a div for the remote video
            const playerContainer = document.createElement('div');
            playerContainer.id = user.uid.toString();
            playerContainer.style.width = '100%';
            playerContainer.style.height = '100%';
            remoteContainer.appendChild(playerContainer);
            
            // Play the remote video
            remoteVideoTrack.play(playerContainer);
          }
        }
        
        // If the remote user published an audio track, play it
        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack;
          if (remoteAudioTrack) {
            remoteAudioTrack.play();
          }
        }
      });
      
      // Handle user leaving
      client.on('user-unpublished', (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        if (mediaType === 'video') {
          // Remove the video container when user unpublishes
          const playerContainer = document.getElementById(user.uid.toString());
          if (playerContainer) {
            playerContainer.remove();
          }
        }
      });
      
      // Join the channel
      const uid = await client.join(
        '0763309372ab4637918e71cb13f52323', // Agora App ID
        channelName,
        token,
        null // Use null for a random UID, or specify a number
      );
      
      console.log('Joined channel with UID:', uid);
      
      // Publish local tracks
      await client.publish([localAudioTrack, localVideoTrack]);
      console.log('Local tracks published');
      
      // Return an object with methods to control the call
      return {
        leave: async () => {
          // Unpublish local tracks
          await client.unpublish([localAudioTrack, localVideoTrack]);
          
          // Leave the channel
          await client.leave();
          console.log('Left the channel');
          
          // Clean up remote user containers
          remoteContainer.innerHTML = '';
        }
      };
    } catch (error) {
      console.error("Error joining Agora channel:", error);
      throw error;
    }
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
