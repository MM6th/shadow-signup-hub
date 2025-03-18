
import React, { useRef, useEffect } from 'react';
import { IRemoteVideoTrack } from 'agora-rtc-sdk-ng';
import { Share2, Link } from 'lucide-react';

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
    // Use a delayed initialization to ensure the DOM is ready
    const playVideoTimeout = setTimeout(() => {
      if (containerRef.current && videoTrack && !videoMuted) {
        console.log("RemoteVideo: Playing video track to container");
        
        try {
          // Stop first in case it was already playing somewhere
          videoTrack.stop();
          // Then play in our container
          videoTrack.play(containerRef.current);
          console.log("RemoteVideo: Video track played successfully");
        } catch (error) {
          console.error("RemoteVideo: Error playing video track:", error);
        }
      }
    }, 200);
    
    return () => {
      clearTimeout(playVideoTimeout);
      
      // Don't call stop here - let the parent component handle track cleanup
      // This prevents the video from stopping when this component re-renders
    };
  }, [videoTrack, videoMuted]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video">
      <div
        ref={containerRef}
        className={`w-full h-full object-cover ${!isConnected || videoMuted ? 'hidden' : ''}`}
        data-testid="remote-video-container"
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
              <div className="flex items-center justify-center mb-2">
                <Share2 size={16} className="mr-2 text-pi-muted" />
                <span className="text-sm">Share your livestream link to invite others</span>
              </div>
              <div className="flex items-center justify-center">
                <Link size={16} className="mr-2 text-pi-muted" />
                <span className="text-xs text-pi-muted">Others can join by opening the link you share</span>
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
