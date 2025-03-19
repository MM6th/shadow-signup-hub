
import React, { useRef, useEffect } from 'react';
import { ICameraVideoTrack } from 'agora-rtc-sdk-ng';

interface LocalVideoProps {
  videoTrack: ICameraVideoTrack | null;
  isVideoOn: boolean;
  isHost?: boolean;
}

const LocalVideo: React.FC<LocalVideoProps> = ({ 
  videoTrack, 
  isVideoOn,
  isHost = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Create or update video element when track changes or visibility changes
    if (containerRef.current) {
      // Clean up any existing video element
      if (videoRef.current) {
        containerRef.current.removeChild(videoRef.current);
        videoRef.current = null;
      }

      if (videoTrack && isVideoOn) {
        console.log("LocalVideo: Creating video element for track", videoTrack.getTrackId());
        
        try {
          // Play the video track directly in the container
          videoTrack.play(containerRef.current);
          console.log("LocalVideo: Video track played successfully");
        } catch (error) {
          console.error("LocalVideo: Error playing video track:", error);
        }
      }
    }
    
    // Clean up function
    return () => {
      if (videoTrack) {
        try {
          videoTrack.stop();
        } catch (error) {
          console.error("LocalVideo: Error stopping video track:", error);
        }
      }
    };
  }, [videoTrack, isVideoOn]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video">
      <div 
        ref={containerRef}
        className={`w-full h-full ${!isVideoOn ? 'hidden' : ''}`}
        data-testid="local-video-container"
      />
      {!isVideoOn && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-white text-xl">You</span>
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
        You {isHost ? '(Host)' : ''}
      </div>
    </div>
  );
};

export default LocalVideo;
