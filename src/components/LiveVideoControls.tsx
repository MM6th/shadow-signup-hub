
import React, { useEffect } from 'react';
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
  
  // If the room is opened directly, check if it matches user's live session
  useEffect(() => {
    fetchUserLiveSession();
  }, [roomId, fetchUserLiveSession]);
  
  const handleEndSession = async () => {
    await endLiveSession();
    
    toast({
      title: 'Live Session Ended',
      description: 'Your live session has been ended successfully',
    });
    
    navigate('/dashboard', { replace: true });
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
