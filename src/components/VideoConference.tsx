
import React, { useRef, useEffect, useState } from 'react';
import { useVideoCall } from '@/components/video-conference/useVideoCall';
import LocalVideo from '@/components/video-conference/LocalVideo';
import RemoteVideo from '@/components/video-conference/RemoteVideo';
import CallControls from '@/components/video-conference/CallControls';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Users, CameraOff, MicOff } from 'lucide-react';
import CallHeader from '@/components/video-conference/CallHeader';
import { Button } from '@/components/ui/button';

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
  
  const [viewerCount, setViewerCount] = useState(1);
  const [callDuration, setCallDuration] = useState(0);
  const [showPermissionMessage, setShowPermissionMessage] = useState(false);

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

  // Request camera/mic permissions and initialize call
  useEffect(() => {
    if (localVideoRef.current && remoteVideoRef.current) {
      const setupCall = async () => {
        try {
          setShowPermissionMessage(true);
          
          // Request camera and microphone permissions
          await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          
          // Initialize the call with Agora
          await initializeCall(localVideoRef.current, remoteVideoRef.current);
          
          setShowPermissionMessage(false);
        } catch (error) {
          console.error('Error requesting media permissions:', error);
          setShowPermissionMessage(false);
          toast({
            title: "Permission Error",
            description: "Please enable camera and microphone access to join the livestream.",
            variant: "destructive",
          });
        }
      };
      
      setupCall();
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
  
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast({
      title: "Conference ID copied",
      description: "Share this ID with others so they can join your livestream",
    });
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
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center text-xs text-muted-foreground">
                <Users size={14} className="mr-1" />
                <span>{viewerCount}</span>
              </div>
              
              {isHost && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopyRoomId}
                >
                  Copy Conference ID
                </Button>
              )}
            </div>
          </div>
          
          {showPermissionMessage && (
            <div className="bg-dark-accent/20 p-4 rounded-lg text-center mb-4">
              <div className="flex justify-center mb-2">
                <CameraOff className="mr-2" /> <MicOff />
              </div>
              <p className="text-pi">Please allow camera and microphone access to join the livestream</p>
            </div>
          )}
          
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
          
          {!isHost && isConnected && (
            <div className="mt-4 p-4 bg-dark-accent/10 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Support the Stream</h3>
              <p className="text-sm text-pi-muted mb-3">If you're enjoying this content, consider supporting the creator.</p>
              <div className="flex justify-center space-x-3">
                <Button variant="default">
                  PayPal Donation
                </Button>
                <Button variant="outline">
                  Crypto Donation
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoConference;
