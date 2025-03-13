
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Briefcase, Tag, PenSquare, ShoppingBag, Plus, User, Film, Video } from 'lucide-react';
import Button from '@/components/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button as ShadcnButton } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import VideoUploader from '@/components/VideoUploader';
import VideoConference from '@/components/VideoConference';

const Dashboard: React.FC = () => {
  const { user, profile, isLoading, hasProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLive, setIsLive] = useState(false);
  const [roomId, setRoomId] = useState<string>('');

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    } else if (!isLoading && user && !hasProfile) {
      navigate('/create-profile');
    }
  }, [user, isLoading, hasProfile, navigate]);

  // Check if user is currently live streaming
  useEffect(() => {
    if (user) {
      const checkLiveStatus = async () => {
        const { data } = await supabase
          .from('live_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();
        
        if (data) {
          setIsLive(true);
          setRoomId(data.room_id);
        }
      };
      
      checkLiveStatus();
    }
  }, [user]);

  const handleEditProfile = () => {
    navigate('/update-profile');
  };

  const startLiveSession = async () => {
    if (!user) return;
    
    const newRoomId = `room_${user.id.substring(0, 8)}_${Date.now()}`;
    setRoomId(newRoomId);
    
    // Record the live session in the database
    await supabase.from('live_sessions').insert({
      user_id: user.id,
      room_id: newRoomId,
      is_active: true,
      title: `${profile?.username}'s Live Session`,
      started_at: new Date().toISOString()
    });
    
    setIsLive(true);
    setActiveTab('livestream');
  };

  const endLiveSession = async () => {
    if (!user || !roomId) return;
    
    // Update the session as inactive
    await supabase
      .from('live_sessions')
      .update({ 
        is_active: false,
        ended_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('room_id', roomId);
    
    setIsLive(false);
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
                {!isLive ? (
                  <Button 
                    variant="primary"
                    onClick={startLiveSession}
                    className="flex items-center gap-2"
                  >
                    <Video size={16} />
                    Go Live
                  </Button>
                ) : (
                  <Button 
                    variant="destructive"
                    onClick={endLiveSession}
                    className="flex items-center gap-2"
                  >
                    <Video size={16} />
                    End Live
                  </Button>
                )}
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
              <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto mb-6">
                <TabsTrigger value="profile">Profile Details</TabsTrigger>
                <TabsTrigger value="products">My Products</TabsTrigger>
                <TabsTrigger value="videos">My Videos</TabsTrigger>
                <TabsTrigger value="livestream">
                  Live Stream
                  {isLive && <div className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
                </TabsTrigger>
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
                  <ShadcnButton onClick={() => navigate('/create-product')} className="flex items-center">
                    <Plus size={16} className="mr-2" /> Create New
                  </ShadcnButton>
                </div>
                
                <ProductsList userId={user.id} />
              </TabsContent>
              
              <TabsContent value="videos">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-medium">My Videos</h2>
                  <div className="text-pi-muted text-sm">Upload videos up to 3GB</div>
                </div>
                
                <VideoUploader userId={user.id} />
              </TabsContent>
              
              <TabsContent value="livestream">
                <div className="mb-6">
                  <h2 className="text-lg font-medium mb-2">Live Video Stream</h2>
                  <p className="text-pi-muted mb-4">
                    {isLive 
                      ? "You are currently live streaming. Your followers can see and join your stream."
                      : "Start a live stream to connect with your followers in real-time."}
                  </p>
                </div>
                
                {isLive && roomId ? (
                  <div className="mb-4">
                    <VideoConference 
                      roomId={roomId} 
                      isHost={true}
                      onEndCall={endLiveSession}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 glass-card">
                    <Video size={64} className="mx-auto text-pi-muted mb-4" />
                    <h3 className="text-xl font-medium mb-2">Start Live Streaming</h3>
                    <p className="text-pi-muted mb-6 max-w-md mx-auto">
                      Share your insights, host discussions, or connect with your audience in real-time.
                    </p>
                    <ShadcnButton onClick={startLiveSession} className="flex items-center mx-auto">
                      <Video size={16} className="mr-2" /> Go Live Now
                    </ShadcnButton>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-4 mt-6">
              <Button variant="primary" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductsList = ({ userId }: { userId: string }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, [userId]);
  
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
  
  return (
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
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;

