import React, { useRef, useEffect, useState } from 'react';
import { useVideoCall } from '@/components/video-conference/useVideoCall';
import LocalVideo from '@/components/video-conference/LocalVideo';
import RemoteVideo from '@/components/video-conference/RemoteVideo';
import CallControls from '@/components/video-conference/CallControls';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Users, CameraOff, MicOff, Link2, Video, Mic, PhoneCall, Share } from 'lucide-react';
import CallHeader from '@/components/video-conference/CallHeader';
import { Button } from '@/components/ui/button';
import ShareWithUsersDialog from '@/components/video-conference/ShareWithUsersDialog';

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
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showPermissionButton, setShowPermissionButton] = useState(true);
  const [showCallButton, setShowCallButton] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const {
    isConnected,
    isMicOn,
    isVideoOn,
    isJoining,
    permissionsGranted,
    initializeCall,
    requestPermissions,
    toggleMic,
    toggleVideo,
    endCall,
    localTracks,
    remoteTracks,
    connectionError
  } = useVideoCall(roomId);

  useEffect(() => {
    if (isConnected) {
      setViewerCount(2); // Host + guest
    } else {
      setViewerCount(1); // Just the host
    }
  }, [isConnected]);

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
    console.log("VideoConference connection status:", { isConnected, isHost });
  }, [isConnected, isHost]);

  useEffect(() => {
    console.log("Current tracks:", {
      localVideo: localTracks.videoTrack?.id,
      localAudio: localTracks.audioTrack?.id,
      remoteVideo: remoteTracks.videoTrack?.id,
      remoteAudio: remoteTracks.audioTrack?.id,
    });
  }, [localTracks, remoteTracks]);

  const handleRequestPermissions = async () => {
    try {
      setShowPermissionMessage(true);
      setPermissionError(null);
      
      console.log("VideoConference: Requesting camera and microphone permissions...");
      
      const permissionsGranted = await requestPermissions();
      
      if (permissionsGranted) {
        setShowPermissionButton(false);
        
        if (localVideoRef.current && remoteVideoRef.current) {
          try {
            await initializeCall(localVideoRef.current, remoteVideoRef.current);
            console.log("VideoConference: Call initialized successfully");
            if (isHost) {
              setShowCallButton(true);
            } else {
              setTimeout(() => {
                handleMakeCall();
              }, 1000);
            }
          } catch (initError: any) {
            console.error("VideoConference: Error initializing call:", initError);
            setPermissionError(`Error initializing call: ${initError.message}`);
            setShowPermissionButton(true);
          }
        } else {
          console.error("VideoConference: Video references not found");
          setPermissionError("Unable to initialize video elements. Please refresh and try again.");
          setShowPermissionButton(true);
        }
      } else {
        console.error("VideoConference: Permission request failed");
        setPermissionError("Camera and microphone access was denied. Please allow access in your browser settings.");
        setShowPermissionButton(true);
      }
      
      setShowPermissionMessage(false);
    } catch (error: any) {
      console.error('VideoConference: Error in permission handling:', error);
      setShowPermissionMessage(false);
      setPermissionError(`Failed to request permissions: ${error.message}`);
      setShowPermissionButton(true);
    }
  };

  const handleMakeCall = () => {
    if (isHost) {
      // Start the call as host (this is simple, just connect to the room)
      console.log("Starting call as host");
    } else {
      // Join the call as a participant
      console.log("Joining call as participant");
    }
    setShowCallButton(false);
  };

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
    const shareableLink = `${window.location.origin}/livestream/${roomId}`;
    navigator.clipboard.writeText(shareableLink);
    toast({
      title: "Livestream link copied",
      description: "Share this link with others so they can join your livestream",
    });
  };

  const handleShowShareDialog = () => {
    setShareDialogOpen(true);
  };

  const handleRetryPermissions = async () => {
    setPermissionError(null);
    handleRequestPermissions();
  };

  const shareableLink = `${window.location.origin}/livestream/${roomId}`;

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
              
              {isHost && isConnected && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleShowShareDialog}
                >
                  <Share size={14} className="mr-1" /> Share with Users
                </Button>
              )}
              
              {isHost && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopyRoomId}
                >
                  <Link2 size={14} className="mr-1" /> Copy Link
                </Button>
              )}
            </div>
          </div>
          
          {showPermissionButton && !isConnected && !isJoining && (
            <div className="bg-primary/10 p-6 rounded-lg text-center mb-4">
              <div className="flex justify-center mb-4">
                <Video className="mr-2 text-primary h-8 w-8" /> 
                <Mic className="text-primary h-8 w-8" />
              </div>
              <p className="text-pi mb-4">To use this livestream, you need to allow camera and microphone access</p>
              <Button 
                onClick={handleRequestPermissions}
                size="lg"
                className="animate-pulse"
              >
                Allow Camera & Mic
              </Button>
            </div>
          )}
          
          {showCallButton && !isConnected && !isJoining && (
            <div className="bg-primary/10 p-6 rounded-lg text-center mb-4">
              <div className="flex justify-center mb-4">
                <PhoneCall className="text-primary h-8 w-8" />
              </div>
              <p className="text-pi mb-4">Your camera and mic are ready. Start the call when you're ready.</p>
              <Button 
                onClick={handleMakeCall}
                size="lg"
                className="animate-pulse"
              >
                Start Call
              </Button>
            </div>
          )}
          
          {showPermissionMessage && (
            <div className="bg-dark-accent/20 p-4 rounded-lg text-center mb-4">
              <div className="flex justify-center mb-2">
                <CameraOff className="mr-2" /> <MicOff />
              </div>
              <p className="text-pi">Please allow camera and microphone access in the browser prompt</p>
            </div>
          )}
          
          {permissionError && (
            <div className="bg-red-500/10 p-4 rounded-lg text-center mb-4">
              <div className="flex justify-center mb-2">
                <CameraOff className="mr-2 text-red-400" /> <MicOff className="text-red-400" />
              </div>
              <p className="text-red-400 mb-2">{permissionError}</p>
              <Button variant="outline" size="sm" onClick={handleRetryPermissions}>
                Retry Permissions
              </Button>
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
              audioMuted={!remoteTracks.audioTrack?.enabled}
              videoMuted={!remoteTracks.videoTrack?.enabled}
            />
          </div>
          
          <CallControls 
            isMicOn={isMicOn}
            isVideoOn={isVideoOn}
            isConnected={permissionsGranted}
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
      
      <ShareWithUsersDialog 
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shareUrl={shareableLink}
      />
    </Card>
  );
};

export default VideoConference;
