
import React, { useState } from 'react';
import { Plus, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LiveStreamModal from './LiveStreamModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface LiveStream {
  id: string;
  title: string;
  thumbnail_url: string;
  conference_id: string;
  created_at: string;
  user_id: string;
  enable_crypto: boolean;
  enable_paypal: boolean;
  views: number;
}

const LiveStreamTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  
  // Fetch user's past streams
  const { data: pastStreams, isLoading } = useQuery({
    queryKey: ['pastStreams', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('livestreams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as LiveStream[];
    },
    enabled: !!user
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Cosmic Live Streaming</h2>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={16} />
          Start New Stream
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="glass-card p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Your Streams</h3>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-pi-muted">Loading your streams...</p>
            </div>
          ) : pastStreams && pastStreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastStreams.map((stream) => (
                <div key={stream.id} className="group glass-card hover:bg-white/5 transition-all overflow-hidden rounded-lg">
                  <div className="relative aspect-video">
                    {stream.thumbnail_url ? (
                      <img 
                        src={stream.thumbnail_url} 
                        alt={stream.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-dark-secondary">
                        <Video size={32} className="text-pi-muted" />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                      {stream.views || 0} views
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h4 className="font-medium line-clamp-1">{stream.title}</h4>
                    <p className="text-xs text-pi-muted mt-1">
                      {formatDistanceToNow(new Date(stream.created_at), { addSuffix: true })}
                    </p>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex space-x-1">
                        {stream.enable_crypto && (
                          <span className="px-2 py-0.5 bg-dark-secondary text-pi-muted text-xs rounded">Crypto</span>
                        )}
                        {stream.enable_paypal && (
                          <span className="px-2 py-0.5 bg-dark-secondary text-pi-muted text-xs rounded">PayPal</span>
                        )}
                      </div>
                      
                      <Button variant="outline" size="sm" onClick={() => window.location.href = `/livestream/${stream.conference_id}`}>
                        Replay
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Video size={48} className="mx-auto text-pi-muted mb-4" />
              <h3 className="text-xl font-medium mb-2">No Streams Yet</h3>
              <p className="text-pi-muted mb-6">
                Start your first cosmic live stream to connect with your audience.
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus size={16} className="mr-2" /> Create Your First Stream
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <LiveStreamModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
};

export default LiveStreamTab;
