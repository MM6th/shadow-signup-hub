
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Briefcase, Tag, PenSquare, ShoppingBag, Plus, User, Film, Trash2 } from 'lucide-react';
import Button from '@/components/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button as ShadcnButton } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import VideoUploader from '@/components/VideoUploader';
import { ChartButton } from '@/components/charts/ChartButton';
import { ScreenplayModal } from '@/components/charts/ScreenplayModal';
import AdsList from '@/components/AdsList';
import { Tags } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";

const Dashboard: React.FC = () => {
  const { user, profile, isLoading, hasProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isScreenplayModalOpen, setIsScreenplayModalOpen] = useState(false);

  // Check if the current user is an admin
  const ADMIN_IDS = ['f64a94e3-3adf-4409-978d-f3106aabf598', '3a25fea8-ec60-4e52-ae40-63f2b1ce89d9'];
  const isAdmin = user && ADMIN_IDS.includes(user.id);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    } else if (!isLoading && user && !hasProfile) {
      navigate('/create-profile');
    }
  }, [user, isLoading, hasProfile, navigate]);

  // Reset the active tab if user is on a restricted tab
  useEffect(() => {
    if (!isAdmin && activeTab === 'screenplays') {
      setActiveTab('profile');
    }
  }, [activeTab, isAdmin]);

  const handleEditProfile = () => {
    navigate('/update-profile');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  // Determine which tabs to show based on admin status
  const tabTriggers = [
    { value: 'profile', label: 'Profile Details' },
    { value: 'products', label: 'My Products' },
  ];
  
  // Add admin-only tabs
  if (isAdmin) {
    tabTriggers.push({ value: 'videos', label: 'My Videos' });
    tabTriggers.push({ value: 'screenplays', label: 'My Screenplays' });
    tabTriggers.push({ value: 'ads', label: 'My Ads' });
  }

  return (
    <div className="min-h-screen bg-dark bg-dark-gradient text-pi py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="relative">
            <div className="h-40 bg-gradient-to-r from-dark-accent to-pi-focus/30"></div>
            <div className="absolute top-24 left-8 rounded-full border-4 border-dark overflow-hidden">
              {profile.profile_photo_url ? (
                <img 
                  src={profile.profile_photo_url} 
                  alt={profile.username} 
                  className="w-32 h-32 object-cover"
                />
              ) : (
                <div className="w-32 h-32 bg-dark-secondary flex items-center justify-center">
                  <span className="text-3xl text-pi-muted">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="h-24"></div>
          </div>
          
          <div className="p-8">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-elixia text-gradient mb-2">
                  {profile.username}
                </h1>
                
                {profile.industry && (
                  <div className="flex items-center text-pi-muted">
                    <Tag size={16} className="mr-2" />
                    <span>{profile.industry}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleEditProfile}
                  className="flex items-center gap-2"
                >
                  <PenSquare size={16} />
                  Edit Profile
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/marketplace')}
                  className="flex items-center gap-2"
                >
                  <ShoppingBag size={16} />
                  Marketplace
                </Button>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
              <TabsList className={`grid grid-cols-${tabTriggers.length} w-full max-w-2xl mx-auto mb-6`}>
                {tabTriggers.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value="profile">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-medium mb-3">Personal Details</h2>
                      <div className="flex items-start">
                        <div className="p-2 rounded-md bg-dark-secondary mr-3">
                          <User size={18} className="text-pi-focus" />
                        </div>
                        <div>
                          <p className="text-sm text-pi-muted">Username</p>
                          <p className="text-pi">{profile.username}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-medium mb-3">Business Details</h2>
                      
                      <div className="space-y-3">
                        {profile.business_type && (
                          <div className="flex items-start">
                            <div className="p-2 rounded-md bg-dark-secondary mr-3">
                              <Briefcase size={18} className="text-pi-focus" />
                            </div>
                            <div>
                              <p className="text-sm text-pi-muted">Business Type</p>
                              <p className="text-pi">{profile.business_type}</p>
                            </div>
                          </div>
                        )}
                        
                        {profile.industry && (
                          <div className="flex items-start">
                            <div className="p-2 rounded-md bg-dark-secondary mr-3">
                              <Tag size={18} className="text-pi-focus" />
                            </div>
                            <div>
                              <p className="text-sm text-pi-muted">Industry</p>
                              <p className="text-pi">{profile.industry}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="products">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-medium">My Products & Services</h2>
                  <div className="flex gap-2">
                    {isAdmin && <ChartButton />} {/* Only admins can create charts */}
                    <ShadcnButton onClick={() => navigate('/create-product')} className="flex items-center">
                      <Plus size={16} className="mr-2" /> Create New
                    </ShadcnButton>
                  </div>
                </div>
                
                <ProductsList userId={user.id} />
              </TabsContent>
              
              {isAdmin && (
                <TabsContent value="videos">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-lg font-medium">My Videos</h2>
                    <div className="text-pi-muted text-sm">Upload videos up to 3GB</div>
                  </div>
                  
                  <VideoUploader userId={user.id} />
                </TabsContent>
              )}
              
              {isAdmin && (
                <TabsContent value="screenplays">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-lg font-medium">My Screenplays</h2>
                    <div className="flex gap-2">
                      <ShadcnButton 
                        onClick={() => setIsScreenplayModalOpen(true)} 
                        className="flex items-center"
                      >
                        <Plus size={16} className="mr-2" /> Create New Screenplay
                      </ShadcnButton>
                    </div>
                  </div>
                  
                  <ScreenplayList userId={user.id} />
                </TabsContent>
              )}
              
              {isAdmin && (
                <TabsContent value="ads">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-lg font-medium">My Advertisements</h2>
                    <div className="flex gap-2">
                      <ShadcnButton 
                        onClick={() => navigate('/marketplace')} 
                        className="flex items-center"
                      >
                        <Tags size={16} className="mr-2" /> View in Marketplace
                      </ShadcnButton>
                    </div>
                  </div>
                  
                  <AdsList userId={user.id} />
                </TabsContent>
              )}
            </Tabs>
            
            <div className="flex justify-end space-x-4 mt-6">
              <Button variant="primary" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {isAdmin && (
        <ScreenplayModal 
          open={isScreenplayModalOpen}
          onOpenChange={setIsScreenplayModalOpen}
        />
      )}
    </div>
  );
};

const ProductsList = ({ userId }: { userId: string }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Could not load your products. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProducts();
  }, [userId]);
  
  const handleDelete = async () => {
    if (!deleteProductId) return;
    
    try {
      // Delete product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteProductId);
        
      if (error) throw error;
      
      // Delete associated wallet addresses
      const { error: walletError } = await supabase
        .from('wallet_addresses')
        .delete()
        .eq('product_id', deleteProductId);
        
      if (walletError) console.error('Warning: Could not delete wallet addresses:', walletError);
      
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully",
      });
      
      // Refresh products list
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Delete failed",
        description: error.message || "An error occurred while deleting the product",
        variant: "destructive"
      });
    } finally {
      setDeleteProductId(null);
      setDeleteDialogOpen(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-pi-muted">Loading your products...</p>
      </div>
    );
  }
  
  if (products.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <ShoppingBag size={48} className="mx-auto text-pi-muted mb-4" />
        <h3 className="text-xl font-medium mb-2">No Products Yet</h3>
        <p className="text-pi-muted mb-6">You haven't added any products or services to your store yet.</p>
        <ShadcnButton onClick={() => navigate('/create-product')}>
          <Plus size={16} className="mr-2" /> Create Your First Product
        </ShadcnButton>
      </div>
    );
  }
  
  const isAdmin = userId === '3a25fea8-ec60-4e52-ae40-63f2b1ce89d9';
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map(product => (
          <div key={product.id} className="glass-card p-4 flex">
            <div className="w-16 h-16 bg-dark-secondary rounded-md overflow-hidden mr-4 flex-shrink-0">
              {product.image_url ? (
                <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag size={24} className="text-pi-muted" />
                </div>
              )}
            </div>
            <div className="flex-grow">
              <h3 className="font-medium line-clamp-1">{product.title}</h3>
              <p className="text-sm text-pi-muted line-clamp-1">{product.description}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="font-medium">${product.price.toFixed(2)}</span>
                <div className="flex gap-2">
                  <ShadcnButton 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/edit-product/${product.id}`)}
                  >
                    Edit
                  </ShadcnButton>
                  {isAdmin && (
                    <ShadcnButton 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        setDeleteProductId(product.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 size={14} />
                    </ShadcnButton>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteProductId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const ScreenplayList = ({ userId }: { userId: string }) => {
  const [screenplays, setScreenplays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScreenplays = async () => {
      try {
        const { data, error } = await supabase
          .from('screenplay_projects')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setScreenplays(data || []);
      } catch (error) {
        console.error('Error fetching screenplays:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchScreenplays();
  }, [userId]);
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-pi-muted">Loading your screenplays...</p>
      </div>
    );
  }
  
  if (screenplays.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Film size={48} className="mx-auto text-pi-muted mb-4" />
        <h3 className="text-xl font-medium mb-2">No Screenplays Yet</h3>
        <p className="text-pi-muted mb-6">You haven't created any screenplays yet.</p>
        <ShadcnButton onClick={() => navigate('/digital-office')}>
          <Plus size={16} className="mr-2" /> Create Your First Screenplay
        </ShadcnButton>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {screenplays.map(screenplay => (
        <div key={screenplay.id} className="glass-card p-4 flex">
          <div className="w-16 h-16 bg-dark-secondary rounded-md overflow-hidden mr-4 flex-shrink-0">
            {screenplay.images && screenplay.images.length > 0 ? (
              <img src={screenplay.images[0]} alt={screenplay.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film size={24} className="text-pi-muted" />
              </div>
            )}
          </div>
          <div className="flex-grow">
            <h3 className="font-medium line-clamp-1">{screenplay.name}</h3>
            <p className="text-sm text-pi-muted line-clamp-1">
              {screenplay.character_description ? 
                screenplay.character_description.substring(0, 60) + '...' : 
                'Screenplay project'}
            </p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-pi-muted">
                {new Date(screenplay.created_at).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <ShadcnButton 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/screenplay/${screenplay.id}`)}
                >
                  View
                </ShadcnButton>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
