
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VideoConference from '@/components/VideoConference';
import { supabase } from '@/integrations/supabase/client';

const VideoConferencePage = () => {
  const { user, isLoading } = useAuth();
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(true);
  
  useEffect(() => {
    // In a real application, you would fetch the appointment details from your database
    // For demo purposes, we're just using the appointment ID as the room ID
    setIsLoadingAppointment(false);
    
    // For demo purposes, randomly decide if user is host or not
    setIsHost(Math.random() > 0.5);
    
  }, [appointmentId]);
  
  if (isLoading || isLoadingAppointment) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    navigate('/');
    return null;
  }
  
  const handleEndCall = () => {
    // In a real application, you might want to update the appointment status here
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen bg-dark bg-dark-gradient flex flex-col">
      <div className="w-full py-4 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-pi-muted hover:text-pi"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
        </Button>
      </div>
      
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <VideoConference 
            roomId={appointmentId || 'unknown-room'} 
            isHost={isHost}
            onEndCall={handleEndCall}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoConferencePage;
