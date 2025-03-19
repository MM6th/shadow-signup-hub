
import React, { useRef, useEffect } from 'react';
import { Share2, Link } from 'lucide-react';

interface RemoteVideoProps {
  isConnected: boolean;
  videoTrack?: MediaStreamTrack | null;
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
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Create or update video element when track changes or visibility changes
    if (containerRef.current) {
      // Clean up any existing video element
      if (videoRef.current) {
        containerRef.current.removeChild(videoRef.current);
        videoRef.current = null;
      }

      if (videoTrack && !videoMuted) {
        console.log("RemoteVideo: Creating video element for track", videoTrack.id);
        
        try {
          // Create a new video element and stream
          const newStream = new MediaStream([videoTrack]);
          const video = document.createElement('video');
          video.srcObject = newStream;
          video.autoplay = true;
          video.playsInline = true;
          video.className = 'w-full h-full object-cover';
          
          // Add the video to the container
          containerRef.current.appendChild(video);
          videoRef.current = video;
          
          video.onloadedmetadata = () => {
            video.play().catch(e => console.error("Error playing video:", e));
          };
          
          console.log("RemoteVideo: Video element created and added to container");
        } catch (error) {
          console.error("RemoteVideo: Error setting up video element:", error);
        }
      }
    }
    
    // Clean up function
    return () => {
      if (videoRef.current && containerRef.current && containerRef.current.contains(videoRef.current)) {
        containerRef.current.removeChild(videoRef.current);
        videoRef.current = null;
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
