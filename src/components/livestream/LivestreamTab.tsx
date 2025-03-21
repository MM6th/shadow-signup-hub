
import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import LiveStreamModal from '@/components/LiveStreamModal';
import { useToast } from '@/hooks/use-toast';
import LivestreamCard from './LivestreamCard';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import { LivestreamType, isStreamActive } from './types';
import { useQuery } from '@tanstack/react-query';

const LivestreamTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: livestreams, isLoading, refetch } = useQuery<LivestreamType[]>({
    queryKey: ['livestreams', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('livestreams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      console.log('Fetched livestreams:', data);
      return data || [];
    },
    enabled: !!user
  });
  
  const handleDeleteStream = async (streamId: string) => {
    try {
      const { error } = await supabase
        .from('livestreams')
        .delete()
        .eq('id', streamId);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Livestream deleted successfully",
      });
      
      // Refresh the list
      refetch();
    } catch (error: any) {
      console.error('Error deleting livestream:', error);
      toast({
        title: "Error",
        description: "Failed to delete livestream",
        variant: "destructive",
      });
    }
  };

  const activeStreams = livestreams?.filter(isStreamActive) || [];
  const pastStreams = livestreams?.filter(stream => !isStreamActive(stream)) || [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Livestreams</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Livestream
        </Button>
      </div>
      
      {isLoading ? (
        <LoadingState />
      ) : livestreams?.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {activeStreams.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Live Now</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeStreams.map((stream) => (
                  <LivestreamCard 
                    key={stream.id} 
                    stream={stream} 
                    onDelete={handleDeleteStream} 
                  />
                ))}
              </div>
            </div>
          )}
          
          {pastStreams.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Past Streams</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastStreams.map((stream) => (
                  <LivestreamCard 
                    key={stream.id} 
                    stream={stream} 
                    onDelete={handleDeleteStream} 
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      <LiveStreamModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onSuccess={refetch}
      />
    </div>
  );
};

export default LivestreamTab;
