
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

  useEffect(() => {
    // Use a delayed initialization to ensure the DOM is ready
    const playVideoTimeout = setTimeout(() => {
      if (containerRef.current && videoTrack && isVideoOn) {
        console.log("LocalVideo: Playing video track to container");
        
        try {
          // Stop first in case it was already playing somewhere
          videoTrack.stop();
          // Then play in our container
          videoTrack.play(containerRef.current);
          console.log("LocalVideo: Video track played successfully");
        } catch (error) {
          console.error("LocalVideo: Error playing video track:", error);
        }
      }
    }, 200);
    
    return () => {
      clearTimeout(playVideoTimeout);
      
      // Don't call stop here - let the parent component handle track cleanup
      // This prevents the video from stopping when this component re-renders
    };
  }, [videoTrack, isVideoOn]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video">
      <div 
        ref={containerRef}
        className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
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
