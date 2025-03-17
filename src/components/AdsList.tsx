
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tags, Plus, Link as LinkIcon, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import AdForm from './AdForm';

interface AdsListProps {
  userId: string;
}

const AdsList: React.FC<AdsListProps> = ({ userId }) => {
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdFormOpen, setIsAdFormOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchAds = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      console.log('Fetched ads:', data);
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast({
        title: "Error fetching ads",
        description: "There was a problem loading your ads.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAds();
  }, [userId]);
  
  const forceDeleteAllAds = async () => {
    try {
      // Identify admin users by their user IDs
      const adminUserIds = ['f64a94e3-3adf-4409-978d-f3106aabf598', '3a25fea8-ec60-4e52-ae40-63f2b1ce89d9'];
      if (!adminUserIds.includes(userId)) {
        console.error('Non-admin user attempted to force delete ads');
        return;
      }
      
      // First, delete all media files from storage
      for (const ad of ads) {
        if (ad && ad.media_url) {
          try {
            const url = new URL(ad.media_url);
            const pathParts = url.pathname.split('/');
            const mediaPath = pathParts[pathParts.length - 2] + '/' + pathParts[pathParts.length - 1];
            
            console.log('Attempting to delete media file:', mediaPath);
            
            const { error: storageError } = await supabase.storage
              .from('ad_media')
              .remove([mediaPath]);
              
            if (storageError) {
              console.error('Error deleting media file:', storageError);
            }
          } catch (mediaError) {
            console.error('Error processing media URL for deletion:', mediaError);
          }
        }
      }
      
      // Then delete all ads from the database
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('user_id', userId);
        
      if (error) throw error;
      
      toast({
        title: "All ads deleted",
        description: "All advertisements have been deleted successfully."
      });
      
      fetchAds();
    } catch (error) {
      console.error('Error force deleting ads:', error);
      toast({
        title: "Error deleting ads",
        description: "There was a problem deleting your ads.",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteAd = async () => {
    if (!adToDelete) return;
    
    try {
      // Get the ad to find the media URL before deletion
      const adToDeleteObj = ads.find(ad => ad.id === adToDelete);
      
      // Delete the ad from the database
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', adToDelete);
        
      if (error) throw error;
      
      if (adToDeleteObj && adToDeleteObj.media_url) {
        try {
          // Extract the path from the URL
          const url = new URL(adToDeleteObj.media_url);
          const pathParts = url.pathname.split('/');
          const mediaPath = pathParts[pathParts.length - 2] + '/' + pathParts[pathParts.length - 1];
          
          console.log('Attempting to delete media file:', mediaPath);
          
          // Delete the media file from storage
          const { error: storageError } = await supabase.storage
            .from('ad_media')
            .remove([mediaPath]);
            
          if (storageError) {
            console.error('Error deleting media file:', storageError);
          }
        } catch (mediaError) {
          console.error('Error processing media URL for deletion:', mediaError);
        }
      }
      
      toast({
        title: "Ad deleted",
        description: "Your ad has been deleted successfully."
      });
      
      // Refresh the ads list
      fetchAds();
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({
        title: "Error deleting ad",
        description: "There was a problem deleting your ad.",
        variant: "destructive"
      });
    } finally {
      setAdToDelete(null);
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your ads...</p>
      </div>
    );
  }
  
  if (ads.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Tags size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No Ads Yet</h3>
        <p className="text-muted-foreground mb-6">You haven't created any advertisements yet.</p>
        <Button onClick={() => setIsAdFormOpen(true)}>
          <Plus size={16} className="mr-2" /> Create Your First Ad
        </Button>
        
        <Dialog open={isAdFormOpen} onOpenChange={setIsAdFormOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Advertisement</DialogTitle>
            </DialogHeader>
            <AdForm onAdCreated={() => {
              setIsAdFormOpen(false);
              fetchAds();
            }} onCancel={() => setIsAdFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  const isAdmin = userId === 'f64a94e3-3adf-4409-978d-f3106aabf598' || 
                 userId === '3a25fea8-ec60-4e52-ae40-63f2b1ce89d9';
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ads.map(ad => (
          <div key={ad.id} className="glass-card p-4 flex">
            <div className="w-16 h-16 bg-dark-secondary rounded-md overflow-hidden mr-4 flex-shrink-0">
              {ad.media_type === 'image' ? (
                <img src={ad.media_url} alt={ad.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-dark flex items-center justify-center">
                  <video src={ad.media_url} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="flex-grow">
              <h3 className="font-medium line-clamp-1">{ad.title}</h3>
              <div className="flex items-center text-xs text-muted-foreground mt-1 mb-2">
                <Tags size={12} className="mr-1" />
                {ad.media_type === 'image' ? 'Image' : 'Video'} Ad
                {ad.product_url && (
                  <span className="ml-2 flex items-center">
                    <LinkIcon size={12} className="mr-1" /> Product Linked
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(ad.created_at).toLocaleDateString()}
                </span>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setAdToDelete(ad.id)}
                >
                  <Trash2 size={14} className="mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {isAdmin && (
        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Admin Controls</h3>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={forceDeleteAllAds}
            >
              <Trash2 size={14} className="mr-1" />
              Force Delete All Ads
            </Button>
          </div>
        </div>
      )}
      
      <div className="mt-6 flex justify-end">
        <Button onClick={() => setIsAdFormOpen(true)}>
          <Plus size={16} className="mr-2" /> Create New Ad
        </Button>
      </div>
      
      <Dialog open={isAdFormOpen} onOpenChange={setIsAdFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Advertisement</DialogTitle>
          </DialogHeader>
          <AdForm 
            onAdCreated={() => {
              setIsAdFormOpen(false);
              fetchAds();
            }} 
            onCancel={() => setIsAdFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!adToDelete} onOpenChange={() => setAdToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Advertisement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this advertisement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAdToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAd}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdsList;
