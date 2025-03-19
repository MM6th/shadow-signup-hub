
import React, { useRef, useEffect } from 'react';

interface LocalVideoProps {
  localStream: MediaStream | null;
  isVideoOn: boolean;
  isHost?: boolean;
}

const LocalVideo: React.FC<LocalVideoProps> = ({ 
  localStream, 
  isVideoOn,
  isHost = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Connect local stream to video element when available
    if (videoRef.current && localStream && isVideoOn) {
      console.log("LocalVideo: Setting local stream to video element");
      videoRef.current.srcObject = localStream;
    }
    
    // Return cleanup function
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [localStream, isVideoOn]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video">
      <video 
        ref={videoRef}
        autoPlay
        playsInline
        muted // Always mute local video to prevent feedback
        className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
        data-testid="local-video-element"
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
