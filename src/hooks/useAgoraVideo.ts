import { useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AgoraRTC from 'agora-rtc-sdk-ng';

interface TokenData {
  token: string;
  channelName: string;
  uid: string;
  expirationTimeInSeconds: number;
}

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
  const [token, setToken] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Use refs to maintain references across renders
  const agoraClientRef = useRef<any | null>(null);
  const localAudioTrackRef = useRef<any | null>(null);
  const localVideoTrackRef = useRef<any | null>(null);
  const isLivestreamingRef = useRef(false);

  // Agora app ID from environment or configuration
  const AGORA_APP_ID = 'fe3e46a0094f486b91a0e90ac8e4379a';

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
    agoraToken: string,
    agoraChannelName: string,
    uid: string | number
  ) => {
    // Ensure client is initialized
    if (!agoraClientRef.current) {
      agoraClientRef.current = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    }
    
    const client = agoraClientRef.current;
    
    if (!localAudioTrackRef.current || !localVideoTrackRef.current) {
      console.error("Local tracks not initialized");
      setError("Audio and video tracks must be initialized before joining channel");
      return undefined;
    }
    
    const localAudioTrack = localAudioTrackRef.current;
    const localVideoTrack = localVideoTrackRef.current;

    try {
      console.log("Joining channel with:", { 
        tokenProvided: !!agoraToken, 
        channelName: agoraChannelName,
        tokenLength: agoraToken.length,
        uid: uid
      });
      
      client.on("connection-state-change", (curState: string, prevState: string) => {
        console.log("Connection state changed from", prevState, "to", curState);
        
        if (curState === "CONNECTED") {
          setIsLoading(false);
          setError(null);
          isLivestreamingRef.current = true;
        } else if (curState === "DISCONNECTED") {
          setError(`Connection failed: ${curState}`);
          setIsLoading(false);
          isLivestreamingRef.current = false;
        }
      });
      
      console.log("Attempting to join Agora channel...");
      
      const joinWithTimeout = async () => {
        return new Promise<number>(async (resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Timeout: Failed to join Agora channel after 15 seconds"));
          }, 15000);
          
          try {
            // Convert the UID to a number explicitly
            const numericUid = typeof uid === 'string' ? parseInt(uid, 10) : uid;
            
            if (typeof uid === 'string' && isNaN(parseInt(uid, 10))) {
              throw new Error("Invalid UID format: must be a numeric value");
            }
            
            console.log("Joining with converted UID:", numericUid);
            
            // Join with the proper numeric UID
            const joinedUid = await client.join(
              AGORA_APP_ID,
              agoraChannelName,
              agoraToken,
              numericUid
            );
            
            clearTimeout(timeout);
            resolve(joinedUid);
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });
      };
      
      const joinedUid = await joinWithTimeout();
      console.log('Joined channel with UID:', joinedUid);
      
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
  }, [AGORA_APP_ID]);

  const initializeTracks = useCallback(async () => {
    try {
      if (!localAudioTrackRef.current) {
        localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
        console.log("Microphone audio track created");
      }
      
      if (!localVideoTrackRef.current) {
        localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack();
        console.log("Camera video track created");
      }
      
      return {
        audioTrack: localAudioTrackRef.current,
        videoTrack: localVideoTrackRef.current
      };
    } catch (err: any) {
      console.error("Error initializing tracks:", err);
      setError(`Failed to initialize audio/video: ${err.message}`);
      throw err;
    }
  }, []);

  const startLivestream = useCallback(async (uid: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Initialize Agora client if not already done
      if (!agoraClientRef.current) {
        console.log("Creating Agora client...");
        agoraClientRef.current = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      }

      // Generate token
      const tokenData = await generateToken(uid);
      if (!tokenData || !tokenData.token || !tokenData.channelName) {
        throw new Error("Failed to generate token for livestream");
      }

      // Initialize tracks
      await initializeTracks();

      // Join the channel and start broadcasting
      await joinChannel(tokenData.token, tokenData.channelName, uid);
      console.log("Livestream started successfully");
      
    } catch (err: any) {
      console.error("Error starting livestream:", err);
      setError(err.message || "Failed to start livestream");
      
      // Cleanup if there was an error
      await stopLivestream();
    } finally {
      setIsLoading(false);
    }
  }, [generateToken, initializeTracks, joinChannel]);

  const stopLivestream = useCallback(async () => {
    try {
      const client = agoraClientRef.current;
      
      if (client && isLivestreamingRef.current) {
        console.log("Stopping livestream...");
        
        // Unpublish tracks if they exist
        if (localAudioTrackRef.current || localVideoTrackRef.current) {
          const tracks = [];
          if (localAudioTrackRef.current) tracks.push(localAudioTrackRef.current);
          if (localVideoTrackRef.current) tracks.push(localVideoTrackRef.current);
          
          if (tracks.length > 0) {
            await client.unpublish(tracks);
            console.log("Unpublished local tracks");
          }
        }
        
        // Leave the channel
        await client.leave();
        console.log("Left Agora channel");
        
        // Cleanup tracks
        if (localAudioTrackRef.current) {
          localAudioTrackRef.current.close();
          localAudioTrackRef.current = null;
          console.log("Closed audio track");
        }
        
        if (localVideoTrackRef.current) {
          localVideoTrackRef.current.close();
          localVideoTrackRef.current = null;
          console.log("Closed video track");
        }
        
        isLivestreamingRef.current = false;
      } else {
        console.log("No active livestream to stop");
      }
    } catch (err: any) {
      console.error("Error stopping livestream:", err);
      setError(`Failed to stop livestream: ${err.message}`);
    }
  }, []);

  return {
    isLoading,
    token,
    channelName,
    error,
    agoraClient: agoraClientRef.current,
    localAudioTrack: localAudioTrackRef.current,
    localVideoTrack: localVideoTrackRef.current,
    generateToken,
    joinChannel,
    startLivestream,
    stopLivestream
  };
};
