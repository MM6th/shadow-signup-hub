
import React from 'react';
import { Clock } from 'lucide-react';

interface CallHeaderProps {
  roomId: string;
  isJoining: boolean;
  isConnected: boolean;
  isHost?: boolean;
  callDuration?: number;
  appointmentTitle?: string;
  appointmentTime?: string;
}

const CallHeader: React.FC<CallHeaderProps> = ({ 
  roomId, 
  isJoining, 
  isConnected,
  isHost = false,
  callDuration = 0,
  appointmentTitle,
  appointmentTime
}) => {
  // Format call duration from seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mb-4 flex justify-between items-center">
      <div>
        <h3 className="text-lg font-medium">
          {isJoining ? 'Connecting...' : (isConnected ? 'Connected' : 'Ready to connect')} - Room: {roomId}
        </h3>
        {appointmentTitle && (
          <p className="text-sm text-pi-muted mt-1">{appointmentTitle}</p>
        )}
        {appointmentTime && (
          <p className="text-xs text-pi-muted">Scheduled: {appointmentTime}</p>
        )}
      </div>
      <div className="flex items-center space-x-3">
        {isConnected && (
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-1 text-pi-muted" />
            <span>{formatDuration(callDuration)}</span>
          </div>
        )}
        {isHost && (
          <div className="px-2 py-1 bg-pi-focus/10 text-pi-focus rounded text-xs font-medium">
            Host
          </div>
        )}
      </div>
    </div>
  );
};

export default CallHeader;
