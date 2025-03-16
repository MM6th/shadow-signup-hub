
import React, { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import LocalVideo from './video-conference/LocalVideo';
import RemoteVideo from './video-conference/RemoteVideo';
import CallControls from './video-conference/CallControls';
import CallHeader from './video-conference/CallHeader';
import { useVideoCall } from './video-conference/useVideoCall';

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

  // Initialize WebRTC and join the channel
  useEffect(() => {
    if (localVideoRef.current && remoteVideoRef.current) {
      initializeCall(localVideoRef.current, remoteVideoRef.current);
    }
    
    // Cleanup function
    return () => {
      handleEndCall();
    };
  }, [roomId]);
  
  // Handle end call
  const handleEndCall = async () => {
    await endCall();
    
    if (onEndCall) {
      onEndCall();
    }
  };

  return (
    <div className="glass-card p-4 flex flex-col h-full">
      <CallHeader 
        roomId={roomId} 
        isJoining={isJoining} 
        isConnected={isConnected} 
        isHost={isHost} 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
        <LocalVideo 
          videoTrack={localTracks.videoTrack} 
          isVideoOn={isVideoOn} 
          isHost={isHost} 
        />
        <RemoteVideo isConnected={isConnected} />
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
