
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
    if (containerRef.current && videoTrack) {
      videoTrack.play(containerRef.current);
    }
    
    return () => {
      if (videoTrack) {
        videoTrack.stop();
      }
    };
  }, [videoTrack]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video">
      <div 
        ref={containerRef}
        className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
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
