
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VideoConference from '@/components/VideoConference';
import PaymentDialog from '@/components/PaymentDialog';
import { useWalletAddresses } from '@/hooks/useWalletAddresses';

interface LiveStreamData {
  id: string;
  title: string;
  thumbnail_url: string | null;
  conference_id: string;
  user_id: string;
  created_at: string;
  ended_at: string | null;
  is_active: boolean;
  views: number;
  enable_crypto: boolean;
  enable_paypal: boolean;
  profiles?: any;
}

const LiveStream: React.FC = () => {
  const { conferenceId } = useParams<{ conferenceId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [streamData, setStreamData] = useState<LiveStreamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  
  // Get wallet addresses for payments
  const { adminWalletAddresses, hasPayPalEnabled, paypalClientId } = useWalletAddresses(
    user,
    streamData?.id || '',
    isHost
  );
  
  const walletData = adminWalletAddresses.length > 0 ? adminWalletAddresses[0] : null;
  
  // Fetch stream data
  useEffect(() => {
    const fetchStreamData = async () => {
      if (!conferenceId) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('livestreams')
          .select('*, profiles(*)')
          .eq('conference_id', conferenceId)
          .single();
          
        if (error) throw error;
        
        setStreamData(data as LiveStreamData);
        setIsHost(user?.id === data.user_id);
        
        // Update view count if not the host
        if (user?.id !== data.user_id) {
          await supabase
            .from('livestreams')
            .update({ views: (data.views || 0) + 1 })
            .eq('id', data.id);
        }
      } catch (error: any) {
        console.error('Error fetching stream data:', error);
        toast({
          title: "Error",
          description: "Could not load stream data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStreamData();
  }, [conferenceId, user, toast]);
  
  const handleEndStream = async () => {
    if (!isHost || !streamData) return;
    
    try {
      // Mark stream as ended
      await supabase
        .from('livestreams')
        .update({ 
          is_active: false,
          ended_at: new Date().toISOString() 
        })
        .eq('id', streamData.id);
        
      toast({
        title: "Stream ended",
        description: "Your live stream has ended successfully",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error ending stream:', error);
      toast({
        title: "Error",
        description: "Failed to end the stream properly",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Loading stream...</p>
        </div>
      </div>
    );
  }
  
  if (!streamData) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center glass-card p-8 rounded-lg">
            <h1 className="text-2xl font-elixia text-gradient mb-4">Stream Not Found</h1>
            <p className="text-pi-muted mb-6">
              The stream you're looking for doesn't exist or has ended.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={16} className="mr-2" /> Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-dark bg-dark-gradient py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-pi-muted hover:text-pi"
            >
              <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </Button>
            <h1 className="text-3xl font-elixia text-gradient mt-2">{streamData.title}</h1>
            <p className="text-pi-muted">
              {isHost ? 'Your live stream' : `${streamData.profiles?.username || 'User'}'s live stream`}
            </p>
          </div>
          
          {!isHost && (streamData.enable_crypto || streamData.enable_paypal) && (
            <Button 
              onClick={() => setPaymentDialogOpen(true)}
              className="flex items-center"
              variant="default"
            >
              Support Stream
            </Button>
          )}
        </div>
        
        <div className="glass-card p-4 rounded-lg mb-6">
          <div className="text-sm text-pi-muted flex items-center justify-between mb-2">
            <span>Conference ID: {conferenceId}</span>
            <span>{streamData.views || 0} viewers</span>
          </div>
          
          <div className="rounded-lg overflow-hidden">
            <VideoConference 
              roomId={conferenceId || ''} 
              isHost={isHost}
              onEndCall={isHost ? handleEndStream : undefined}
            />
          </div>
        </div>
      </div>
      
      {!isHost && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          product={{
            id: streamData.id,
            title: `Support for ${streamData.title}`,
            price: 10.00,
            enable_paypal: streamData.enable_paypal,
            paypal_client_id: paypalClientId,
            contact_phone: streamData.profiles?.phone_number
          }}
          walletData={streamData.enable_crypto ? walletData : null}
        />
      )}
    </div>
  );
};

export default LiveStream;
