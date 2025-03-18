
import React, { useState } from 'react';
import { Video, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LiveStream {
  id: string;
  title: string;
  thumbnail_url: string | null;
  conference_id: string;
  created_at: string;
  user_id: string;
  enable_crypto: boolean;
  enable_paypal: boolean;
  views: number;
  is_active: boolean;
  ended_at: string | null;
}

const LiveStreamTab: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [streamToDelete, setStreamToDelete] = useState<string | null>(null);
  
  // Fetch user's past streams
  const { data: pastStreams, isLoading, refetch } = useQuery<LiveStream[]>({
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

  // Handle stream click - navigate to the livestream page
  const handleStreamClick = (conferenceId: string) => {
    navigate(`/livestream/${conferenceId}`);
  };
  
  // Handle delete stream
  const handleDeleteStream = async () => {
    if (!streamToDelete) return;
    
    try {
      // Delete the livestream from the database
      const { error } = await supabase
        .from('livestreams')
        .delete()
        .eq('id', streamToDelete);
        
      if (error) throw error;
      
      // Show success message
      toast({
        title: "Stream deleted",
        description: "The livestream has been successfully deleted",
      });
      
      // Refresh the streams list
      refetch();
    } catch (error: any) {
      console.error('Error deleting stream:', error);
      toast({
        title: "Error",
        description: "Failed to delete the livestream. Please try again.",
        variant: "destructive",
      });
    } finally {
      setStreamToDelete(null);
    }
  };

  return (
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
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleStreamClick(stream.conference_id)}
                      >
                        {stream.is_active ? "Join" : "Replay"}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setStreamToDelete(stream.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Stream</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this livestream? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setStreamToDelete(null)}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteStream}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveStreamTab;
