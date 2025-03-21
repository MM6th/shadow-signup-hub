
import AgoraRTC from 'agora-rtc-sdk-ng';
import { TracksRef } from './agoraTracksManager';

export const setupClientEvents = (
  client: any,
  setIsConnected: (connected: boolean) => void,
  setConnectionError: (error: string | null) => void,
  remoteTracksRef: React.MutableRefObject<TracksRef>,
  remoteVideoRef: HTMLDivElement
) => {
  client.on("connection-state-change", (curState: string, prevState: string) => {
    console.log(`Client connection state changed from ${prevState} to ${curState}`);
    if (curState === "CONNECTED") {
      setIsConnected(true);
      setConnectionError(null);
    } else if (curState === "DISCONNECTED") {
      setIsConnected(false);
      setConnectionError(`Connection state: ${curState}`);
    }
  });
  
  client.on("token-privilege-did-expire", async () => {
    console.log("Token expired");
    setConnectionError("Token expired. Please refresh the page and try again.");
  });
  
  client.on('user-published', async (user: any, mediaType: 'audio' | 'video') => {
    console.log(`Remote user ${user.uid} published ${mediaType} track`);
    await client.subscribe(user, mediaType);
    
    if (mediaType === 'video') {
      remoteTracksRef.current.videoTrack = user.videoTrack;
      if (user.videoTrack) {
        console.log("Playing remote video track");
        try {
          user.videoTrack.play(remoteVideoRef);
          console.log("Remote video track played successfully");
        } catch (playErr) {
          console.error("Error playing remote video track:", playErr);
        }
      }
    }
    
    if (mediaType === 'audio') {
      remoteTracksRef.current.audioTrack = user.audioTrack;
      if (user.audioTrack) {
        console.log("Playing remote audio track");
        try {
          user.audioTrack.play();
          console.log("Remote audio track played successfully");
        } catch (playErr) {
          console.error("Error playing remote audio track:", playErr);
        }
      }
    }
  });
  
  client.on('user-unpublished', (user: any, mediaType: 'audio' | 'video') => {
    console.log(`Remote user ${user.uid} unpublished ${mediaType} track`);
    if (mediaType === 'video') {
      remoteTracksRef.current.videoTrack = null;
    }
    if (mediaType === 'audio') {
      remoteTracksRef.current.audioTrack = null;
    }
  });
  
  return client;
};

export const createAgoraClient = () => {
  return AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
};
