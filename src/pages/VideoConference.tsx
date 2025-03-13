
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLiveSessions } from '@/hooks/useLiveSessions';
import LiveVideoControls from '@/components/LiveVideoControls';
import { ArrowLeft, Video } from 'lucide-react';

const VideoConference: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { liveSessions } = useLiveSessions();
  
  const [isLiveSession, setIsLiveSession] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  
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
    
    // Load the video conference (mock implementation)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [roomId, liveSessions]);
  
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
        {/* Main video area - in a real implementation this would connect to a video service */}
        <div className="grid grid-cols-2 gap-4 p-4 h-full">
          <div className="bg-gray-800 rounded-lg overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Video size={64} className="text-gray-600" />
            </div>
            <div className="absolute bottom-4 left-4 bg-gray-900 px-2 py-1 rounded text-sm">
              You
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg overflow-hidden relative">
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
          <Button variant="outline" className="rounded-full h-12 w-12 flex items-center justify-center p-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/></svg>
          </Button>
          
          <Button variant="outline" className="rounded-full h-12 w-12 flex items-center justify-center p-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-video"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
          </Button>
          
          <Button variant="destructive" className="rounded-full h-12 w-12 flex items-center justify-center p-0" onClick={() => navigate('/dashboard')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone-off"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="22" x2="2" y1="2" y2="22"/></svg>
          </Button>
        </div>
        
        {/* Live session controls */}
        <LiveVideoControls roomId={roomId} />
      </div>
    </div>
  );
};

export default VideoConference;
