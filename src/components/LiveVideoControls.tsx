
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { useLiveSessions } from '@/hooks/useLiveSessions';
import { useNavigate } from 'react-router-dom';
import { Video, VideoOff } from 'lucide-react';

interface LiveVideoControlsProps {
  roomId: string;
}

const LiveVideoControls: React.FC<LiveVideoControlsProps> = ({ roomId }) => {
  const { userLiveSession, endLiveSession, fetchUserLiveSession } = useLiveSessions();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  // If the room is opened directly, check if it matches user's live session
  useEffect(() => {
    fetchUserLiveSession();
  }, [roomId, fetchUserLiveSession]);
  
  // Set up webcam stream
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        // Set the stream to local state for reference
        setLocalStream(stream);
        
        // Find video elements on the page and attach stream
        const localVideo = document.getElementById('local-video') as HTMLVideoElement;
        if (localVideo) {
          localVideo.srcObject = stream;
          console.log('Local video source set successfully');
        } else {
          console.warn('Local video element not found');
        }
      } catch (error) {
        console.error('Error accessing camera/microphone:', error);
        toast({
          title: 'Media Error',
          description: 'Could not access your camera or microphone. Please check your permissions.',
          variant: 'destructive',
        });
      }
    };
    
    initializeMedia();
    
    return () => {
      // Cleanup: stop all tracks when component unmounts
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);
  
  const handleEndSession = async () => {
    try {
      console.log('Ending live session:', userLiveSession?.id);
      
      // Stop all media tracks
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      await endLiveSession();
      
      toast({
        title: 'Live Session Ended',
        description: 'Your live session has been ended successfully',
      });
      
      // Navigate back to dashboard 
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: 'Error',
        description: 'Failed to end the live session. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Only show controls if this is the user's active live session
  if (!userLiveSession || userLiveSession.room_id !== roomId) {
    return null;
  }
  
  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
      <div className="bg-red-600 rounded-full px-4 py-2 flex items-center space-x-2 animate-pulse">
        <VideoOff size={16} className="text-white" />
        <span className="text-white text-sm font-medium">LIVE</span>
      </div>
      
      <Button 
        variant="destructive"
        onClick={handleEndSession}
        size="sm"
      >
        End Live Session
      </Button>
    </div>
  );
};

export default LiveVideoControls;
