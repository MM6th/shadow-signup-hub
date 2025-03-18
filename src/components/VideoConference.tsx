
import React, { useRef, useEffect, useState } from 'react';
import { useVideoCall } from '@/components/video-conference/useVideoCall';
import LocalVideo from '@/components/video-conference/LocalVideo';
import RemoteVideo from '@/components/video-conference/RemoteVideo';
import CallControls from '@/components/video-conference/CallControls';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Users } from 'lucide-react';
import CallHeader from '@/components/video-conference/CallHeader';

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
    remoteTracks,
    initializeCall,
    toggleMic,
    toggleVideo,
    endCall
  } = useVideoCall(roomId);
  
  const [viewerCount, setViewerCount] = useState(1);
  const [callDuration, setCallDuration] = useState(0);

  // Call duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isConnected) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isConnected]);

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
    <Card className="border-none shadow-none bg-transparent overflow-hidden">
      <CardContent className="p-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                {isHost ? <User size={16} /> : <Users size={16} />}
              </div>
              <div>
                <CallHeader 
                  roomId={roomId}
                  isJoining={isJoining}
                  isConnected={isConnected}
                  isHost={isHost}
                  callDuration={callDuration}
                />
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
              videoTrack={remoteTracks.videoTrack}
              audioMuted={false}
              videoMuted={!remoteTracks.videoTrack}
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
      </CardContent>
    </Card>
  );
};

export default VideoConference;
