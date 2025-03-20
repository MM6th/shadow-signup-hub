
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Play, Video, Share2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import VideoPlayer from '@/components/VideoPlayer';

const LivestreamTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [livestreams, setLivestreams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState<any>(null);
  
  // Fetch user's livestreams
  const fetchLivestreams = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('livestreams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setLivestreams(data || []);
      console.log("Fetched livestreams:", data);
      
    } catch (error: any) {
      console.error('Error fetching livestreams:', error);
      toast({
        title: "Error",
        description: "Failed to load livestreams",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchLivestreams();
  }, [user]);
  
  const handleCreateLivestream = async () => {
    if (!user || !title.trim()) return;
    
    try {
      setIsCreating(true);
      
      // Generate a unique conference ID
      const conferenceId = `live-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create a new livestream record
      const { data, error } = await supabase
        .from('livestreams')
        .insert({
          title: title.trim(),
          user_id: user.id,
          conference_id: conferenceId,
          is_active: true
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: "Livestream created",
        description: "Your livestream has been created successfully"
      });
      
      // Close dialog and reset form
      setIsCreateDialogOpen(false);
      setTitle('');
      
      // Navigate to the livestream page
      navigate(`/livestream/${conferenceId}`);
      
    } catch (error: any) {
      console.error('Error creating livestream:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create livestream",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleEndLivestream = async (id: string) => {
    try {
      const { error } = await supabase
        .from('livestreams')
        .update({ 
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Livestream ended",
        description: "Your livestream has been ended"
      });
      
      // Refresh the list
      fetchLivestreams();
      
    } catch (error: any) {
      console.error('Error ending livestream:', error);
      toast({
        title: "Error",
        description: "Failed to end livestream",
        variant: "destructive",
      });
    }
  };
  
  const handleViewStream = (stream: any) => {
    setSelectedStream(stream);
  };
  
  const handleShareStream = (conferenceId: string) => {
    const streamUrl = `${window.location.origin}/livestream/${conferenceId}`;
    
    try {
      navigator.clipboard.writeText(streamUrl);
      toast({
        title: "Link copied",
        description: "Livestream link copied to clipboard"
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy this URL: " + streamUrl,
        variant: "destructive"
      });
    }
  };
  
  // Get livestream video URL
  const getLivestreamVideoUrl = (conferenceId: string) => {
    // This should be the URL where the recorded livestream is stored
    return `/api/livestream/recording/${conferenceId}`;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Livestreams</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={fetchLivestreams}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Video className="h-4 w-4 mr-2" />
            Start New Livestream
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : livestreams.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            You haven't created any livestreams yet. Click 'Start New Livestream' to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {livestreams.map(stream => (
            <Card key={stream.id} className="overflow-hidden">
              <CardHeader className="p-4">
                <CardTitle className="text-lg truncate">{stream.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="p-4 pt-0">
                <div className="flex items-center text-sm mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    stream.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {stream.is_active ? 'Active' : 'Ended'}
                  </span>
                  <span className="ml-2 text-gray-500">
                    {new Date(stream.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="h-40 bg-gray-100 flex items-center justify-center rounded">
                  {stream.thumbnail_url ? (
                    <img 
                      src={stream.thumbnail_url} 
                      alt={stream.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Video className="h-12 w-12 text-gray-400" />
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="p-4 flex gap-2">
                {stream.is_active ? (
                  <>
                    <Button 
                      variant="default" 
                      onClick={() => navigate(`/livestream/${stream.conference_id}`)}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Join
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleShareStream(stream.conference_id)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleEndLivestream(stream.id)}
                    >
                      End
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="default" 
                      onClick={() => handleViewStream(stream)}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      View Recording
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleShareStream(stream.conference_id)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create Livestream Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Livestream</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Livestream Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your livestream"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLivestream} 
              disabled={!title.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Start Livestream
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Recording Dialog */}
      {selectedStream && (
        <Dialog open={!!selectedStream} onOpenChange={(open) => !open && setSelectedStream(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedStream.title}</DialogTitle>
            </DialogHeader>
            
            <div className="pt-4">
              <VideoPlayer 
                src={getLivestreamVideoUrl(selectedStream.conference_id)}
                title={selectedStream.title}
                videoId={selectedStream.conference_id}
                userId={user?.id || ''}
                inDialog={true}
              />
            </div>
            
            <DialogFooter>
              <Button onClick={() => setSelectedStream(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LivestreamTab;
