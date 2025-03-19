
import React, { useRef, useEffect } from 'react';

interface LocalVideoProps {
  videoTrack: MediaStreamTrack | null;
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
        console.log("LocalVideo: Creating video element for track", videoTrack.id);
        
        try {
          // Create a new video element and stream
          const newStream = new MediaStream([videoTrack]);
          const video = document.createElement('video');
          video.srcObject = newStream;
          video.autoplay = true;
          video.muted = true; // Mute local video to prevent feedback
          video.playsInline = true;
          video.className = 'w-full h-full object-cover';
          
          // Add the video to the container
          containerRef.current.appendChild(video);
          videoRef.current = video;
          
          video.onloadedmetadata = () => {
            video.play().catch(e => console.error("Error playing video:", e));
          };
          
          console.log("LocalVideo: Video element created and added to container");
        } catch (error) {
          console.error("LocalVideo: Error setting up video element:", error);
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
