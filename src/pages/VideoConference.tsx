
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLiveSessions } from '@/hooks/useLiveSessions';
import LiveVideoControls from '@/components/LiveVideoControls';
import { ArrowLeft, Video, Mic, MicOff, VideoOff, Phone } from 'lucide-react';

const VideoConference: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { liveSessions } = useLiveSessions();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [isLiveSession, setIsLiveSession] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  useEffect(() => {
    if (!roomId) {
      navigate('/dashboard');
      return;
    }
    
    // Check if this is a live session
    const liveSession = liveSessions.find(session => session.room_id === roomId);
    if (liveSession) {
      setIsLiveSession(true);
      setSessionTitle(liveSession.title);
    }
    
    // Initialize camera and microphone
    const initMedia = async () => {
      try {
        console.log('Requesting media permissions...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          console.log('Local video set successfully');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast({
          title: 'Camera Access Error',
          description: 'Could not access your camera or microphone. Please check your device settings.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };
    
    initMedia();
    
    return () => {
      // Cleanup function to stop all tracks when component unmounts
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId, liveSessions, navigate, toast]);
  
  const toggleMic = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        setIsMicOn(audioTracks[0].enabled);
      }
    }
  };
  
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        setIsVideoOn(videoTracks[0].enabled);
      }
    }
  };
  
  const handleEndCall = () => {
    // Stop all tracks before navigating away
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    navigate('/dashboard');
  };
  
  if (!roomId) {
    return null;
  }
  
  if (isLoading) {
    return (
      <div className="h-screen w-full bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Connecting to video conference...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen bg-dark flex flex-col">
      <div className="flex items-center p-4 bg-gray-900">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft size={20} />
        </Button>
        
        <h1 className="text-xl font-semibold flex-1">
          {isLiveSession ? (
            <div className="flex items-center">
              <span>{sessionTitle}</span>
              <div className="ml-2 bg-red-600 rounded-full px-2 py-0.5 flex items-center text-xs text-white">
                <Video size={12} className="mr-1" />
                LIVE
              </div>
            </div>
          ) : (
            <span>Video Conference</span>
          )}
        </h1>
      </div>
      
      <div className="flex-1 relative">
        {/* Main video area - now properly connected to camera */}
        <div className="grid grid-cols-2 gap-4 p-4 h-full">
          <div className="bg-gray-800 rounded-lg overflow-hidden relative">
            <video
              id="local-video"
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-gray-900 px-2 py-1 rounded text-sm">
              You
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg overflow-hidden relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Video size={64} className="text-gray-600" />
            </div>
            <div className="absolute bottom-4 left-4 bg-gray-900 px-2 py-1 rounded text-sm">
              Participant
            </div>
          </div>
        </div>
        
        {/* Video controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
          <Button 
            variant="outline" 
            className={`rounded-full h-12 w-12 flex items-center justify-center p-0 ${!isMicOn ? 'bg-red-500 text-white' : ''}`}
            onClick={toggleMic}
          >
            {isMicOn ? (
              <Mic size={20} />
            ) : (
              <MicOff size={20} />
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className={`rounded-full h-12 w-12 flex items-center justify-center p-0 ${!isVideoOn ? 'bg-red-500 text-white' : ''}`}
            onClick={toggleVideo}
          >
            {isVideoOn ? (
              <Video size={20} />
            ) : (
              <VideoOff size={20} />
            )}
          </Button>
          
          <Button 
            variant="destructive" 
            className="rounded-full h-12 w-12 flex items-center justify-center p-0" 
            onClick={handleEndCall}
          >
            <Phone size={20} className="rotate-135" />
          </Button>
        </div>
        
        {/* Live session controls */}
        <LiveVideoControls roomId={roomId} />
      </div>
    </div>
  );
};

export default VideoConference;
