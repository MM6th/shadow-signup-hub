
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Mic, MicOff, VideoOff, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAgoraVideo } from '@/hooks/useAgoraVideo';
import AgoraRTC, { ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

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
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const agoraClientRef = useRef<any>(null);
  const localTracksRef = useRef<{
    audioTrack: IMicrophoneAudioTrack | null;
    videoTrack: ICameraVideoTrack | null;
  }>({
    audioTrack: null,
    videoTrack: null
  });
  
  const { generateToken, joinChannel, isLoading: isTokenLoading } = useAgoraVideo(roomId);
  const [isJoining, setIsJoining] = useState(false);

  // Initialize WebRTC and join the channel
  useEffect(() => {
    const initAgoraAndJoin = async () => {
      try {
        setIsJoining(true);
        
        // Create local tracks (camera and microphone)
        const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localTracksRef.current = {
          audioTrack: microphoneTrack,
          videoTrack: cameraTrack
        };
        
        // Display local video
        if (localVideoRef.current && cameraTrack) {
          cameraTrack.play(localVideoRef.current);
        }
        
        // Generate a token for the Agora channel
        const uid = Math.floor(Math.random() * 100000).toString();
        const tokenData = await generateToken(uid);
        
        if (!tokenData) {
          throw new Error("Failed to generate Agora token");
        }
        
        // Join the Agora channel
        if (remoteVideoRef.current && localTracksRef.current.audioTrack && localTracksRef.current.videoTrack) {
          agoraClientRef.current = await joinChannel(
            localTracksRef.current.audioTrack,
            localTracksRef.current.videoTrack,
            remoteVideoRef.current
          );
          
          setIsConnected(true);
          toast({
            title: "Connected to room",
            description: `You've joined room: ${roomId}`,
          });
        }
      } catch (error: any) {
        console.error('Error initializing Agora:', error);
        toast({
          title: "Connection Error",
          description: error.message || "Could not connect to the video call. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsJoining(false);
      }
    };
    
    initAgoraAndJoin();
    
    // Cleanup function
    return () => {
      handleEndCall();
    };
  }, [roomId, generateToken, joinChannel, toast]);
  
  // Toggle microphone
  const toggleMic = () => {
    if (localTracksRef.current.audioTrack) {
      if (isMicOn) {
        localTracksRef.current.audioTrack.setEnabled(false);
      } else {
        localTracksRef.current.audioTrack.setEnabled(true);
      }
      setIsMicOn(!isMicOn);
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localTracksRef.current.videoTrack) {
      if (isVideoOn) {
        localTracksRef.current.videoTrack.setEnabled(false);
      } else {
        localTracksRef.current.videoTrack.setEnabled(true);
      }
      setIsVideoOn(!isVideoOn);
    }
  };
  
  // End call
  const handleEndCall = async () => {
    // Leave the Agora channel
    if (agoraClientRef.current) {
      await agoraClientRef.current.leave();
    }
    
    // Close and release local tracks
    if (localTracksRef.current.audioTrack) {
      localTracksRef.current.audioTrack.close();
    }
    if (localTracksRef.current.videoTrack) {
      localTracksRef.current.videoTrack.close();
    }
    
    localTracksRef.current = {
      audioTrack: null,
      videoTrack: null
    };
    
    setIsConnected(false);
    
    if (onEndCall) {
      onEndCall();
    }
  };

  return (
    <div className="glass-card p-4 flex flex-col h-full">
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
        {/* Local video */}
        <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video">
          <div 
            ref={localVideoRef}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
            You {isHost ? '(Host)' : ''}
          </div>
        </div>
        
        {/* Remote video */}
        <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video">
          <div
            ref={remoteVideoRef}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
            {isConnected ? 'Remote User' : 'Waiting for connection...'}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center space-x-4 mt-4">
        <Button
          variant="outline"
          className={!isMicOn ? "bg-destructive text-white" : ""}
          onClick={toggleMic}
          disabled={isJoining || !isConnected}
        >
          {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
        </Button>
        
        <Button
          variant="outline"
          className={!isVideoOn ? "bg-destructive text-white" : ""}
          onClick={toggleVideo}
          disabled={isJoining || !isConnected}
        >
          {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
        </Button>
        
        <Button
          variant="destructive"
          onClick={handleEndCall}
          disabled={isJoining || !isConnected}
        >
          <Phone size={18} className="rotate-135" />
        </Button>
      </div>
    </div>
  );
};

export default VideoConference;
