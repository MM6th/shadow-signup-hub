import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ShoppingCart, Star, QrCode, User, Phone, Video, Shield, Play, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ProductCard from '@/components/ProductCard';
import FeaturedServices from '@/components/FeaturedServices';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import VideoConference from '@/components/VideoConference';

// Admin access email
const ADMIN_EMAILS = ['cmooregee@gmail.com'];

// Categories for filtering
const categories = [
  { id: 'all', name: 'All Services' },
  { id: 'reading', name: 'Personal Readings' },
  { id: 'consulting', name: 'Consulting' },
  { id: 'strategy', name: 'Strategy' },
  { id: 'subscription', name: 'Subscriptions' },
  { id: 'workshop', name: 'Workshops' },
  { id: 'ebook', name: 'Digital Products' },
  { id: 'video', name: 'Videos' },
  { id: 'livestream', name: 'Live Now' }
];

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [walletAddresses, setWalletAddresses] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState<any[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [selectedLiveStream, setSelectedLiveStream] = useState<any>(null);
  const [isLiveStreamDialogOpen, setIsLiveStreamDialogOpen] = useState(false);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setProducts(data || []);
        
        // Fetch wallet addresses for all products
        if (data && data.length > 0) {
          const productIds = data.map(product => product.id);
          const { data: walletData, error: walletError } = await supabase
            .from('wallet_addresses')
            .select('*')
            .in('product_id', productIds);
            
          if (walletError) throw walletError;
          
          // Group wallet addresses by product_id
          const walletsByProduct = (walletData || []).reduce((acc: any, wallet: any) => {
            if (!acc[wallet.product_id]) {
              acc[wallet.product_id] = [];
            }
            acc[wallet.product_id].push(wallet);
            return acc;
          }, {});
          
          setWalletAddresses(walletsByProduct);
        }

        // Fetch uploaded videos if user is authenticated
        if (user) {
          const { data: videoData, error: videoError } = await supabase
            .from('video_metadata')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (videoError) throw videoError;
          
          setVideos(videoData || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error loading products",
          description: "There was a problem loading the products. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, [toast, user]);

  useEffect(() => {
    const fetchLiveStreams = async () => {
      try {
        // Get active live streams
        const { data: streamsData, error: streamsError } = await supabase
          .from('live_sessions')
          .select(`
            *,
            profiles:user_id (username, profile_photo_url)
          `)
          .eq('is_active', true);
          
        if (streamsError) throw streamsError;
        
        setLiveStreams(streamsData || []);
        
        // Subscribe to live stream changes
        const channel = supabase
          .channel('public:live_sessions')
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'live_sessions' 
          }, payload => {
            // Refresh live streams when changes occur
            fetchLiveStreams();
          })
          .subscribe();
          
        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error('Error fetching live streams:', error);
      }
    };
    
    fetchLiveStreams();
  }, []);

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleVideoClick = (video: any) => {
    // Get the video URL
    const videoUrl = supabase.storage
      .from('profile_videos')
      .getPublicUrl(video.video_path).data.publicUrl;
    
    // Open the video in a new tab
    window.open(videoUrl, '_blank');
  };

  const handleJoinLiveStream = (stream: any) => {
    setSelectedLiveStream(stream);
    setIsLiveStreamDialogOpen(true);
  };

  const getQRCodeUrl = (text: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=200x200&bgcolor=ffffff`;
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && selectedCategory !== 'livestream';
  });

  const filteredVideos = videos.filter(video => {
    if (selectedCategory !== 'all' && selectedCategory !== 'video') return false;
    return video.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const filteredLiveStreams = liveStreams.filter(stream => {
    if (selectedCategory !== 'all' && selectedCategory !== 'livestream') return false;
    
    // If we have search term, filter by streamer's username
    if (searchTerm) {
      return stream.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-dark bg-dark-gradient text-pi py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-elixia text-gradient mb-2">Cosmic Marketplace</h1>
            <p className="text-pi-muted max-w-3xl">
              Discover products and services designed to align your business with cosmic energies and
              maximize your potential for success and growth.
            </p>
          </div>
          
          <div className="flex gap-2">
            {isAdmin && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => navigate('/admin-nft')}
              >
                <Shield size={18} />
                <span className="hidden sm:inline">Admin NFT</span>
              </Button>
            )}
            
            {user && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => navigate('/dashboard')}
              >
                <User size={18} />
                <span className="hidden sm:inline">My Profile</span>
              </Button>
            )}
          </div>
        </div>

        {/* Featured Services Carousel */}
        <FeaturedServices />

        {/* Search and Filter */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pi-muted" />
              <Input
                type="text"
                placeholder="Search for products or services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-dark-secondary border-dark-accent"
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="text-xs"
                >
                  {category.name}
                  {category.id === 'livestream' && liveStreams.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-500 rounded-full">
                      {liveStreams.length}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Streams Section */}
        {filteredLiveStreams.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <Tv className="h-6 w-6 text-red-500" />
              <h2 className="text-2xl font-medium">Live Now</h2>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredLiveStreams.map(stream => (
                <div 
                  key={stream.id} 
                  className="glass-card rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                  onClick={() => handleJoinLiveStream(stream)}
                >
                  <div className="h-48 bg-dark-secondary overflow-hidden relative">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pi-focus/30 to-dark">
                      {stream.profiles?.profile_photo_url ? (
                        <img 
                          src={stream.profiles.profile_photo_url} 
                          alt={stream.profiles.username} 
                          className="w-20 h-20 rounded-full object-cover border-2 border-white"
                        />
                      ) : (
                        <User size={48} className="text-white opacity-50" />
                      )}
                    </div>
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                      LIVE
                    </div>
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                        <Play size={48} className="text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-lg mb-1">{stream.title || `${stream.profiles?.username}'s Live Stream`}</h3>
                    <p className="text-pi-muted text-sm mb-2">
                      Hosted by {stream.profiles?.username || 'Unknown Host'}
                    </p>
                    <div className="flex items-center text-xs">
                      <span className="bg-dark-accent text-pi-muted px-2 py-1 rounded-full">
                        Click to join
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Product & Video Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-12 w-12 border-4 border-pi-focus rounded-full border-t-transparent"></div>
          </div>
        ) : filteredProducts.length === 0 && filteredVideos.length === 0 && filteredLiveStreams.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-pi-muted mb-4" />
            <h2 className="text-2xl font-medium mb-2">No Products Found</h2>
            <p className="text-pi-muted mb-6">
              {searchTerm || selectedCategory !== 'all' 
                ? "No products match your current filters. Try adjusting your search criteria."
                : "There are no products available in the marketplace yet."}
            </p>
            <Button onClick={() => navigate('/create-product')}>Create Your Own Product</Button>
          </div>
        ) : (
          <>
            {/* Display products */}
            {filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={{
                      id: product.id,
                      user_id: product.user_id,
                      title: product.title,
                      description: product.description,
                      price: product.price,
                      image_url: product.image_url,
                      category: product.category,
                      type: product.type,
                      contact_phone: product.contact_phone,
                    }} 
                    onClick={() => handleProductClick(product)} 
                    showEditButton={true}
                  />
                ))}
              </div>
            )}
            
            {/* Display videos if filtered or if video category is selected */}
            {filteredVideos.length > 0 && (
              <>
                {filteredProducts.length > 0 && (
                  <div className="flex items-center gap-3 mb-6 mt-4">
                    <Video className="h-6 w-6 text-pi-focus" />
                    <h2 className="text-2xl font-medium">Videos</h2>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {filteredVideos.map(video => (
                    <div 
                      key={video.id} 
                      className="glass-card rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                      onClick={() => handleVideoClick(video)}
                    >
                      <div className="h-48 bg-dark-secondary overflow-hidden relative">
                        {video.thumbnail_url ? (
                          <img 
                            src={video.thumbnail_url} 
                            alt={video.title} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-accent to-dark">
                            <Video size={48} className="text-pi-focus opacity-50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={48} className="text-white" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-lg mb-1 truncate">{video.title}</h3>
                        {video.description && (
                          <p className="text-pi-muted text-sm line-clamp-2 mb-2">{video.description}</p>
                        )}
                        <div className="flex items-center text-xs text-pi-muted">
                          <span>Click to watch</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Product Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          {selectedProduct && (
            <>
              <DialogTitle className="text-2xl font-elixia text-gradient">
                {selectedProduct.title}
              </DialogTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="bg-dark rounded-lg overflow-hidden">
                  <img 
                    src={selectedProduct.image_url || '/placeholder.svg'} 
                    alt={selectedProduct.title} 
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500 mr-1" />
                    <span className="text-white font-medium">5.0</span>
                    <span className="text-pi-muted ml-1">(New)</span>
                  </div>
                  <DialogDescription className="text-pi mb-4">
                    {selectedProduct.description}
                  </DialogDescription>
                  
                  <div className="text-2xl font-medium text-white mb-2">
                    ${selectedProduct.price.toFixed(2)}{selectedProduct.type !== 'tangible' ? '/hr' : ''}
                  </div>
                  
                  {selectedProduct.contact_phone && (
                    <div className="flex items-center text-pi mb-4">
                      <Phone className="h-4 w-4 mr-2" />
                      <span className="text-sm">Contact: {selectedProduct.contact_phone}</span>
                    </div>
                  )}
                  
                  {/* Payment Options */}
                  {walletAddresses[selectedProduct.id] && walletAddresses[selectedProduct.id].length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium mb-2">Payment Options:</h3>
                      <div className="space-y-2">
                       

