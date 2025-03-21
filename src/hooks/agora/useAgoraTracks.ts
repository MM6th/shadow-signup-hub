
import { useCallback, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

export interface TracksRef {
  audioTrack: any | null;
  videoTrack: any | null;
}

export const useAgoraTracks = () => {
  const localAudioTrackRef = useRef<any | null>(null);
  const localVideoTrackRef = useRef<any | null>(null);
  
  const createTracks = useCallback(async (
    audioConfig?: any, 
    videoConfig?: any
  ) => {
    try {
      console.log("Creating microphone and camera tracks...");
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks(
        audioConfig || {
          AEC: true,
          AGC: true,
          ANS: true
        },
        videoConfig || {
          encoderConfig: {
            width: 640,
            height: 360,
            frameRate: 15,
            bitrateMin: 400,
            bitrateMax: 800
          }
        }
      );
      
      localAudioTrackRef.current = tracks[0];
      localVideoTrackRef.current = tracks[1];
      
      console.log("Tracks created successfully:", { 
        audioTrackId: tracks[0]?.getTrackId(),
        videoTrackId: tracks[1]?.getTrackId()
      });
      
      return {
        audioTrack: tracks[0],
        videoTrack: tracks[1]
      };
    } catch (err: any) {
      console.error("Error creating tracks:", err);
      if (err.name === "NotAllowedError" || err.message?.includes("Permission")) {
        throw new Error("Camera or microphone permission denied. Please check your browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        throw new Error("No camera or microphone found. Please connect devices and try again.");
      } else {
        throw new Error(`Failed to access media devices: ${err.message}`);
      }
    }
  }, []);

  const closeTracks = useCallback(() => {
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
  }, []);

  return {
    localAudioTrack: localAudioTrackRef.current,
    localVideoTrack: localVideoTrackRef.current,
    createTracks,
    closeTracks
  };
};
