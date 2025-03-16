
import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, Phone } from 'lucide-react';

interface CallControlsProps {
  isMicOn: boolean;
  isVideoOn: boolean;
  isConnected: boolean;
  isJoining: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

const CallControls: React.FC<CallControlsProps> = ({
  isMicOn,
  isVideoOn,
  isConnected,
  isJoining,
  onToggleMic,
  onToggleVideo,
  onEndCall
}) => {
  return (
    <div className="flex justify-center space-x-4 mt-4">
      <Button
        variant="outline"
        className={!isMicOn ? "bg-destructive text-white" : ""}
        onClick={onToggleMic}
        disabled={isJoining || !isConnected}
      >
        {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
      </Button>
      
      <Button
        variant="outline"
        className={!isVideoOn ? "bg-destructive text-white" : ""}
        onClick={onToggleVideo}
        disabled={isJoining || !isConnected}
      >
        {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
      </Button>
      
      <Button
        variant="destructive"
        onClick={onEndCall}
        disabled={isJoining || !isConnected}
      >
        <Phone size={18} className="rotate-135" />
      </Button>
    </div>
  );
};

export default CallControls;
