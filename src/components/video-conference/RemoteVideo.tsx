
import React, { useRef, useEffect } from 'react';
import { Share2, Link } from 'lucide-react';
import { IRemoteVideoTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';

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
    // Play or stop video track when component mounts or track changes
    if (containerRef.current && videoTrack && !videoMuted) {
      console.log("RemoteVideo: Playing video track");
      
      try {
        // Play the video track directly in the container
        videoTrack.play(containerRef.current);
        console.log("RemoteVideo: Video track played successfully");
      } catch (error) {
        console.error("RemoteVideo: Error playing video track:", error);
      }
    }
    
    // Clean up function
    return () => {
      if (videoTrack) {
        try {
          videoTrack.stop();
        } catch (error) {
          console.error("RemoteVideo: Error stopping video track:", error);
        }
      }
    };
  }, [videoTrack, videoMuted]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video">
      <div
        ref={containerRef}
        className={`w-full h-full ${!isConnected || videoMuted ? 'hidden' : ''}`}
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
