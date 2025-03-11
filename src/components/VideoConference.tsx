
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Mic, MicOff, VideoOff, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize WebRTC
  useEffect(() => {
    const initWebRTC = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        // Save local stream
        localStreamRef.current = stream;
        
        // Display local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Create peer connection
        const configuration = { 
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] 
        };
        
        peerConnectionRef.current = new RTCPeerConnection(configuration);
        
        // Add local tracks to peer connection
        stream.getTracks().forEach(track => {
          if (peerConnectionRef.current) {
            peerConnectionRef.current.addTrack(track, stream);
          }
        });
        
        // Set up remote stream handling
        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };
        
        // In a real app, you would set up signaling here
        // This is a simplified example without actual peer connection
        
        // For demo purposes, we'll just set connected after initialization
        setTimeout(() => {
          setIsConnected(true);
          toast({
            title: "Connected to room",
            description: `You've joined room: ${roomId}`,
          });
        }, 1000);
        
      } catch (error) {
        console.error('Error initializing WebRTC:', error);
        toast({
          title: "Camera/Microphone Error",
          description: "Could not access your camera or microphone. Please check permissions.",
          variant: "destructive",
        });
      }
    };
    
    initWebRTC();
    
    // Cleanup function
    return () => {
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      // Stop all tracks in local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId, toast]);
  
  // Toggle microphone
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };
  
  // End call
  const handleEndCall = () => {
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Stop all tracks in local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsConnected(false);
    
    if (onEndCall) {
      onEndCall();
    }
  };

  return (
    <div className="glass-card p-4 flex flex-col h-full">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">
          {isConnected ? 'Connected' : 'Connecting...'} - Room: {roomId}
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
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
            You {isHost ? '(Host)' : ''}
          </div>
        </div>
        
        {/* Remote video */}
        <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
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
        >
          {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
        </Button>
        
        <Button
          variant="outline"
          className={!isVideoOn ? "bg-destructive text-white" : ""}
          onClick={toggleVideo}
        >
          {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
        </Button>
        
        <Button
          variant="destructive"
          onClick={handleEndCall}
        >
          <Phone size={18} className="rotate-135" />
        </Button>
      </div>
    </div>
  );
};

export default VideoConference;
