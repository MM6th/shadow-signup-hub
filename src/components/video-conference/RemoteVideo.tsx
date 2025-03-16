
import React, { useRef } from 'react';

interface RemoteVideoProps {
  isConnected: boolean;
}

const RemoteVideo: React.FC<RemoteVideoProps> = ({ isConnected }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video">
      <div
        ref={containerRef}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
        {isConnected ? 'Remote User' : 'Waiting for connection...'}
      </div>
    </div>
  );
};

export default RemoteVideo;
