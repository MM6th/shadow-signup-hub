
import AgoraRTC from 'agora-rtc-sdk-ng';

// Types for track management
export interface TracksRef {
  audioTrack: any | null;
  videoTrack: any | null;
}

export const createLocalTracks = async (
  audioConfig?: any, 
  videoConfig?: any
): Promise<{ microphoneTrack: any; cameraTrack: any }> => {
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
    
    const microphoneTrack = tracks[0];
    const cameraTrack = tracks[1];
    
    console.log("Tracks created successfully:", { 
      audioTrackId: microphoneTrack?.getTrackId(),
      videoTrackId: cameraTrack?.getTrackId()
    });
    
    return { microphoneTrack, cameraTrack };
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
};

export const cleanupTracks = (tracksRef: TracksRef) => {
  if (tracksRef.audioTrack) {
    tracksRef.audioTrack.close();
    tracksRef.audioTrack = null;
  }
  
  if (tracksRef.videoTrack) {
    tracksRef.videoTrack.close();
    tracksRef.videoTrack = null;
  }
};

export const toggleTrackEnabled = (track: any, enable: boolean) => {
  if (track) {
    track.setEnabled(enable);
    return true;
  }
  return false;
};

export const playVideoTrack = async (track: any, element: HTMLDivElement): Promise<void> => {
  if (track && element) {
    try {
      await track.play(element);
      console.log("Video track played successfully");
    } catch (err) {
      console.error("Error playing video track:", err);
      throw err;
    }
  } else {
    console.warn("Cannot play video track - track or element is null", {
      hasTrack: !!track,
      hasElement: !!element
    });
  }
};
