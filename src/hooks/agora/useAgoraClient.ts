
import { useCallback, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

export const useAgoraClient = (appId: string) => {
  const agoraClientRef = useRef<any | null>(null);
  
  const createClient = useCallback(() => {
    if (!agoraClientRef.current) {
      agoraClientRef.current = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    }
    return agoraClientRef.current;
  }, []);

  const joinChannel = useCallback(async (
    agoraToken: string,
    agoraChannelName: string,
    uid: string | number,
    tracks: any[]
  ) => {
    const client = createClient();
    
    try {
      console.log("Joining channel with:", { 
        tokenProvided: !!agoraToken, 
        channelName: agoraChannelName,
        tokenLength: agoraToken.length,
        uid: uid
      });
      
      client.on("connection-state-change", (curState: string, prevState: string) => {
        console.log("Connection state changed from", prevState, "to", curState);
      });
      
      console.log("Attempting to join Agora channel...");
      
      const joinWithTimeout = async () => {
        return new Promise<number>(async (resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Timeout: Failed to join Agora channel after 15 seconds"));
          }, 15000);
          
          try {
            const numericUid = typeof uid === 'string' ? parseInt(uid, 10) : uid;
            
            if (typeof uid === 'string' && isNaN(parseInt(uid, 10))) {
              throw new Error("Invalid UID format: must be a numeric value");
            }
            
            console.log("Joining with converted UID:", numericUid);
            
            const joinedUid = await client.join(
              appId,
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
      
      if (tracks.length > 0) {
        console.log("Publishing local tracks...");
        try {
          await client.publish(tracks);
          console.log('Local tracks published successfully');
        } catch (publishError) {
          console.error("Error publishing tracks, retrying:", publishError);
          await new Promise(resolve => setTimeout(resolve, 1000));
          await client.publish(tracks);
          console.log('Local tracks published successfully on retry');
        }
      }
      
      return client;
    } catch (error: any) {
      console.error("Error joining Agora channel:", error);
      throw error;
    }
  }, [appId, createClient]);

  const leaveChannel = useCallback(async () => {
    const client = agoraClientRef.current;
    if (client) {
      try {
        await client.leave();
        console.log("Left Agora channel");
        return true;
      } catch (error) {
        console.error("Error leaving channel:", error);
        throw error;
      }
    }
    return false;
  }, []);

  const unpublishTracks = useCallback(async (tracks: any[]) => {
    const client = agoraClientRef.current;
    if (client && tracks.length > 0) {
      try {
        await client.unpublish(tracks);
        console.log("Unpublished tracks successfully");
        return true;
      } catch (error) {
        console.error("Error unpublishing tracks:", error);
        throw error;
      }
    }
    return false;
  }, []);

  return {
    client: agoraClientRef.current,
    createClient,
    joinChannel,
    leaveChannel,
    unpublishTracks
  };
};
