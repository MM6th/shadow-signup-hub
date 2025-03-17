import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ShoppingCart, Star, QrCode, User, Phone, Video, Shield, Play, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ProductCard from '@/components/ProductCard';
import FeaturedServices from '@/components/FeaturedServices';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import AdDisplay from '@/components/AdDisplay';
import VideoPlayer from '@/components/VideoPlayer';

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
  { id: 'video', name: 'Videos' }
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
  const [ads, setAds] = useState<any[]>([]);
  const [isLoadingAds, setIsLoadingAds] = useState(true);
  
  // Video player state
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState('');
  const [activeVideoId, setActiveVideoId] = useState('');
  const [activeVideoUserId, setActiveVideoUserId] = useState('');

  // Check if user is admin
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

        // Fetch uploaded videos
        const { data: videoData, error: videoError } = await supabase
          .from('video_metadata')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (videoError) throw videoError;
        
        setVideos(videoData || []);
        
        // Fetch ads
        const { data: adsData, error: adsError } = await supabase
          .from('ads')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (adsError) throw adsError;
        
        setAds(adsData || []);
      } catch (error) {
        console.error('Error fetching marketplace data:', error);
        toast({
          title: "Error loading marketplace data",
          description: "There was a problem loading the data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setIsLoadingAds(false);
      }
    };
    
    fetchProducts();
  }, [toast, user]);

  // Filter products based on search term and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter videos based on search term when video category is selected
  const filteredVideos = videos.filter(video => {
    if (selectedCategory !== 'all' && selectedCategory !== 'video') return false;
    return video.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Filter ads based on search term
  const filteredAds = ads.filter(ad => {
    return ad.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (ad.industry && ad.industry.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleVideoClick = (video: any) => {
    // Get the video URL
    const videoUrl = supabase.storage
      .from('profile_videos')
      .getPublicUrl(video.video_path).data.publicUrl;
    
    // Set active video information
    setActiveVideoUrl(videoUrl);
    setActiveVideoTitle(video.title);
    setActiveVideoId(video.video_path);
    setActiveVideoUserId(video.user_id);
    setIsVideoDialogOpen(true);
  };

  const getQRCodeUrl = (text: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=200x200&bgcolor=ffffff`;
  };

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
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Ads Section */}
        {!isLoadingAds && filteredAds.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <Tags className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-medium">Featured Advertisements</h2>
            </div>
            
            <AdDisplay ads={filteredAds} />
          </div>
        )}

        {/* Product & Video Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-12 w-12 border-4 border-pi-focus rounded-full border-t-transparent"></div>
          </div>
        ) : filteredProducts.length === 0 && filteredVideos.length === 0 && filteredAds.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-pi-muted mb-4" />
            <h2 className="text-2xl font-medium mb-2">No Items Found</h2>
            <p className="text-pi-muted mb-6">
              {searchTerm || selectedCategory !== 'all' 
                ? "No items match your current filters. Try adjusting your search criteria."
                : "There are no items available in the marketplace yet."}
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
            
            {/* Display videos */}
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
          <DialogContent className="bg-dark-secondary border-dark-accent max-w-3xl">
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
                          {walletAddresses[selectedProduct.id].map((wallet: any) => (
                            <div key={wallet.id} className="p-3 rounded bg-dark">
                              <p className="text-sm font-medium capitalize">{wallet.crypto_type}</p>
                              <div className="flex items-center">
                                <code className="text-xs text-gray-400 truncate flex-1">
                                  {wallet.wallet_address}
                                </code>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(wallet.wallet_address);
                                      
                                      // Record the purchase
                                      supabase.functions.invoke('send-purchase-confirmation', {
                                        body: {
                                          productTitle: selectedProduct.title,
                                          productPrice: selectedProduct.price,
                                          walletAddress: wallet.wallet_address,
                                          cryptoType: wallet.crypto_type,
                                          contactPhone: selectedProduct.contact_phone || "Not provided"
                                        },
                                      });
                                      
                                      toast({
                                        title: "Address copied",
                                        description: `Send ${selectedProduct.price} ${wallet.crypto_type} to complete your purchase. Contact the seller at ${selectedProduct.contact_phone || "unknown"} after payment.`,
                                      });
                                    }}
                                  >
                                    Copy
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      window.open(getQRCodeUrl(wallet.wallet_address), '_blank');
                                    }}
                                  >
                                    <QrCode size={16} className="mr-1" />
                                    QR
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {user && selectedProduct.user_id === user.id ? (
                        <Button 
                          className="w-full" 
                          onClick={() => {
                            setIsDialogOpen(false);
                            navigate(`/edit-product/${selectedProduct.id}`);
                          }}
                        >
                          Edit Product
                        </Button>
                      ) : (
                        <Button 
                          className="w-full" 
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Video Player Dialog */}
        <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
          <DialogContent className="bg-dark-secondary border-dark-accent p-0 max-w-4xl">
            {activeVideoUrl && (
              <VideoPlayer 
                src={activeVideoUrl} 
                title={activeVideoTitle}
                videoId={activeVideoId}
                userId={activeVideoUserId}
                onClose={() => setIsVideoDialogOpen(false)}
                inDialog={true}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Marketplace;
