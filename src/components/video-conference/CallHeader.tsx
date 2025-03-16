
import React from 'react';

interface CallHeaderProps {
  roomId: string;
  isJoining: boolean;
  isConnected: boolean;
  isHost?: boolean;
}

const CallHeader: React.FC<CallHeaderProps> = ({ 
  roomId, 
  isJoining, 
  isConnected,
  isHost = false
}) => {
  return (
    <div className="mb-4 flex justify-between items-center">
      <h3 className="text-lg font-medium">
        {isJoining ? 'Connecting...' : (isConnected ? 'Connected' : 'Ready to connect')} - Room: {roomId}
      </h3>
      {isHost && (
        <div className="px-2 py-1 bg-pi-focus/10 text-pi-focus rounded text-xs font-medium">
          Host
        </div>
      )}
    </div>
  );
};

export default CallHeader;
