
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  
  const {
    isConnected,
    isMicOn,
    isVideoOn,
    isJoining,
    initializeCall,
    toggleMic,
    toggleVideo,
    endCall
  } = useVideoCall(roomId);
  
  // Initialize call when component mounts
  useEffect(() => {
    if (localVideoRef.current && remoteVideoRef.current) {
      initializeCall(localVideoRef.current, remoteVideoRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [initializeCall]);
  
  // Start timer when connected
  useEffect(() => {
    if (isConnected && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isConnected]);
  
  const handleEndCall = async () => {
    await endCall();
    
    if (onEndCall) {
      onEndCall();
    } else {
      navigate('/dashboard');
    }
  };
  
  return (
    <div className="flex flex-col">
      <CallHeader 
        roomId={roomId}
        isJoining={isJoining}
        isConnected={isConnected}
        isHost={isHost}
        callDuration={callDuration}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <div ref={localVideoRef} className="hidden"></div>
          <LocalVideo 
            videoTrack={isConnected ? null : null} 
            isVideoOn={isVideoOn}
            isHost={isHost}
          />
        </div>
        
        <div className="relative">
          <div ref={remoteVideoRef} className="hidden"></div>
          <RemoteVideo isConnected={isConnected} />
        </div>
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
