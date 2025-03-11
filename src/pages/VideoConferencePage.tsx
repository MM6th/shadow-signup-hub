
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VideoConference from '@/components/VideoConference';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AppointmentDetails {
  id: string;
  product_title: string;
  buyer_name: string;
  seller_id: string;
  buyer_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

const VideoConferencePage = () => {
  const { user, isLoading } = useAuth();
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appointmentDetails, setAppointmentDetails] = useState<AppointmentDetails | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(true);
  
  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      if (!user || !appointmentId) return;
      
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', appointmentId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('Appointment not found');
        }
        
        // Check if the current user is authorized to join this meeting
        if (data.seller_id !== user.id && data.buyer_id !== user.id) {
          throw new Error('You are not authorized to join this meeting');
        }
        
        setAppointmentDetails(data as AppointmentDetails);
        setIsHost(data.seller_id === user.id);
      } catch (error: any) {
        console.error('Error fetching appointment:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch appointment details',
          variant: 'destructive',
        });
        navigate('/dashboard');
      } finally {
        setIsLoadingAppointment(false);
      }
    };
    
    if (user && !isLoading) {
      fetchAppointmentDetails();
    }
  }, [user, appointmentId, isLoading, navigate, toast]);
  
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

  if (!appointmentDetails) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient flex items-center justify-center">
        <div className="text-center">
          <p className="text-pi-muted">Appointment not found or you don't have access to it.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
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
      
      <div className="p-4">
        <div className="mb-4 max-w-6xl mx-auto">
          <h2 className="text-xl font-semibold text-white">
            {appointmentDetails.product_title}
          </h2>
          <p className="text-sm text-gray-400">
            {new Date(appointmentDetails.appointment_date).toLocaleDateString()} at {appointmentDetails.appointment_time}
          </p>
        </div>
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
