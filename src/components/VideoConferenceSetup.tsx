
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Video, VideoOff, Mic, MicOff, Phone } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VideoConferenceSetupProps {
  appointmentId: string;
  channelName?: string;
  isSeller?: boolean;
}

const VideoConferenceSetup: React.FC<VideoConferenceSetupProps> = ({
  appointmentId,
  channelName = 'default',
  isSeller = false
}) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch appointment details
    const fetchAppointmentDetails = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, product:products(*)')
        .eq('id', appointmentId)
        .single();

      if (error) {
        console.error('Error fetching appointment:', error);
        toast({
          title: "Error",
          description: "Could not fetch appointment details",
          variant: "destructive",
        });
        return;
      }

      setAppointmentDetails(data);
    };

    if (appointmentId) {
      fetchAppointmentDetails();
    }
  }, [appointmentId, toast]);

  const handleToggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  const handleToggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleJoinMeeting = async () => {
    try {
      setIsJoining(true);
      
      // In a real implementation, you would:
      // 1. Generate an Agora token from your server/edge function
      // 2. Initialize the Agora SDK
      // 3. Join the channel
      
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update appointment status if seller joins
      if (isSeller && appointmentDetails) {
        await supabase
          .from('appointments')
          .update({ status: 'in_progress' })
          .eq('id', appointmentId);
      }
      
      // Redirect to the video conference room
      window.location.href = `/video-conference/${appointmentId}?video=${isVideoEnabled}&audio=${isAudioEnabled}`;
      
    } catch (error: any) {
      console.error('Error joining meeting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join meeting",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Join Video Conference</CardTitle>
        <CardDescription>
          {appointmentDetails ? (
            <>
              {appointmentDetails.product_title} - {new Date(appointmentDetails.appointment_date).toLocaleDateString()} at {appointmentDetails.appointment_time}
            </>
          ) : (
            "Loading appointment details..."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            <Label htmlFor="video-toggle">Camera</Label>
          </div>
          <Switch
            id="video-toggle"
            checked={isVideoEnabled}
            onCheckedChange={handleToggleVideo}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            <Label htmlFor="audio-toggle">Microphone</Label>
          </div>
          <Switch
            id="audio-toggle"
            checked={isAudioEnabled}
            onCheckedChange={handleToggleAudio}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleJoinMeeting} 
          className="w-full"
          disabled={isJoining}
        >
          {isJoining ? "Joining..." : "Join Meeting"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VideoConferenceSetup;
