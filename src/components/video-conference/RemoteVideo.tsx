
import React, { useRef, useEffect } from 'react';
import { IRemoteVideoTrack } from 'agora-rtc-sdk-ng';
import { Share2 } from 'lucide-react';

interface RemoteVideoProps {
  isConnected: boolean;
  videoTrack?: IRemoteVideoTrack | null;
  audioMuted?: boolean;
  videoMuted?: boolean;
}

const RemoteVideo: React.FC<RemoteVideoProps> = ({ 
  isConnected, 
  videoTrack,
  audioMuted = false,
  videoMuted = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && videoTrack && !videoMuted) {
      videoTrack.play(containerRef.current);
    }
    
    return () => {
      if (videoTrack) {
        videoTrack.stop();
      }
    };
  }, [videoTrack, videoMuted]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video">
      <div
        ref={containerRef}
        className={`w-full h-full object-cover ${!isConnected || videoMuted ? 'hidden' : ''}`}
      />
      {(!isConnected || videoMuted) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
          <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mb-3">
            <span className="text-white text-xl">
              {isConnected ? 'Video Off' : 'Waiting...'}
            </span>
          </div>
          
          {!isConnected && (
            <div className="text-center px-4">
              <p className="text-pi-muted mb-2">Waiting for someone to join</p>
              <div className="flex items-center justify-center">
                <Share2 size={16} className="mr-2 text-pi-muted" />
                <span className="text-sm">Share your conference ID to invite others</span>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded flex items-center">
        <span>{isConnected ? 'Remote User' : 'Waiting for connection...'}</span>
        {audioMuted && isConnected && (
          <span className="ml-2 text-xs bg-red-500/70 px-1 rounded-sm">Muted</span>
        )}
      </div>
    </div>
  );
};

export default RemoteVideo;
