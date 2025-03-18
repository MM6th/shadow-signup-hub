
import React, { useRef, useEffect, useState } from 'react';
import { useVideoCall } from '@/components/video-conference/useVideoCall';
import LocalVideo from '@/components/video-conference/LocalVideo';
import RemoteVideo from '@/components/video-conference/RemoteVideo';
import CallControls from '@/components/video-conference/CallControls';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Users } from 'lucide-react';

interface VideoConferenceProps {
  roomId: string;
  isHost?: boolean;
  onEndCall?: () => void;
}

const VideoConference: React.FC<VideoConferenceProps> = ({
  roomId,
  isHost = false,
  onEndCall
}) => {
  const { toast } = useToast();
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  
  const {
    isConnected,
    isMicOn,
    isVideoOn,
    isJoining,
    localTracks,
    initializeCall,
    toggleMic,
    toggleVideo,
    endCall
  } = useVideoCall(roomId);
  
  const [viewerCount, setViewerCount] = useState(1);

  useEffect(() => {
    if (localVideoRef.current && remoteVideoRef.current) {
      initializeCall(localVideoRef.current, remoteVideoRef.current);
    }
    
    // Cleanup function
    return () => {
      endCall();
    };
  }, []);

  const handleEndCall = () => {
    endCall();
    if (onEndCall) {
      onEndCall();
    } else {
      toast({
        title: "Call ended",
        description: "You've left the video conference",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
            {isHost ? <User size={16} /> : <Users size={16} />}
          </div>
          <div>
            <h3 className="text-sm font-medium">{isHost ? 'Your Stream' : 'Live Stream'}</h3>
            <p className="text-xs text-muted-foreground">Room: {roomId}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center text-xs text-muted-foreground">
            <Users size={14} className="mr-1" />
            <span>{viewerCount}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LocalVideo 
          videoTrack={localTracks.videoTrack} 
          isVideoOn={isVideoOn}
          isHost={isHost}
        />
        
        <RemoteVideo 
          isConnected={isConnected}
          videoTrack={null}
          audioMuted={false}
          videoMuted={false}
        />
      </div>
      
      <CallControls 
        isMicOn={isMicOn}
        isVideoOn={isVideoOn}
        isConnected={isConnected}
        isJoining={isJoining}
        onToggleMic={toggleMic}
        onToggleVideo={toggleVideo}
        onEndCall={handleEndCall}
      />
    </div>
  );
};

export default VideoConference;
