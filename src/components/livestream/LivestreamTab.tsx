import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Video, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import LiveStreamModal from '@/components/LiveStreamModal';
import { formatDistanceToNow } from 'date-fns';
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

const LivestreamTab: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [livestreams, setLivestreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [streamToDelete, setStreamToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchLivestreams();
  }, [user]);

  const fetchLivestreams = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('livestreams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setLivestreams(data || []);
    } catch (error: any) {
      console.error('Error fetching livestreams:', error);
      toast({
        title: "Error",
        description: "Failed to load livestreams",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLivestream = (conferenceId: string, isActive: boolean) => {
    navigate(`/livestream/${conferenceId}`);
  };
  
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
      fetchLivestreams();
    } catch (error: any) {
      console.error('Error deleting livestream:', error);
      toast({
        title: "Error",
        description: "Failed to delete livestream",
        variant: "destructive",
      });
    } finally {
      setStreamToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Livestreams</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Livestream
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : livestreams.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center py-10">
            <Video className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Livestreams</h3>
            <p className="text-gray-500">
              You haven't created any livestreams yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {livestreams.map((stream) => (
            <Card key={stream.id} className="overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                {stream.thumbnail_url ? (
                  <img 
                    src={stream.thumbnail_url} 
                    alt={stream.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Video className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                {stream.is_active && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    Live
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-medium text-lg mb-2">{stream.title}</h3>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Views: {stream.views}</span>
                  <span>
                    {stream.is_active 
                      ? 'Started ' + formatDistanceToNow(new Date(stream.created_at), { addSuffix: true })
                      : 'Ended ' + formatDistanceToNow(new Date(stream.ended_at || stream.created_at), { addSuffix: true })
                    }
                  </span>
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-0 flex justify-between">
                <Button 
                  className="flex-1 mr-2" 
                  onClick={() => handleJoinLivestream(stream.conference_id, stream.is_active)}
                >
                  {stream.is_active ? 'Join' : 'Play Recording'}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" onClick={() => setStreamToDelete(stream.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Livestream</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this livestream? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteStream(stream.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <LiveStreamModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onSuccess={fetchLivestreams}
      />
    </div>
  );
};

export default LivestreamTab;
