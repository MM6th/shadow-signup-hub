
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Image, Video, ExternalLink, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import ProductCard from '@/components/ProductCard';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from "@/integrations/supabase/client";

interface Ad {
  id: string;
  title: string;
  media_type: 'image' | 'video';
  media_url: string;
  product_url: string | null;
  industry: string | null;
  created_at: string;
  user_id?: string;
}

interface AdDisplayProps {
  ads: Ad[];
  isLoading?: boolean;
}

const AdDisplay: React.FC<AdDisplayProps> = ({ ads, isLoading = false }) => {
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const { profile } = useProfile(selectedAd?.user_id);

  // Fetch product data when an ad is selected
  useEffect(() => {
    if (selectedAd && selectedAd.product_url && isDialogOpen) {
      fetchProductData(selectedAd.product_url);
    }
  }, [selectedAd, isDialogOpen]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="text-center p-8 border border-gray-700 rounded-md bg-dark-secondary">
        <Tags className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No Ads Found</h3>
        <p className="text-muted-foreground mb-4">
          There are no ads to display at this time.
        </p>
      </div>
    );
  }

  const handleAdClick = (ad: Ad) => {
    if (ad.product_url) {
      setSelectedAd(ad);
      setIsDialogOpen(true);
    }
  };

  // Fetch product info from Supabase directly
  const fetchProductData = async (productId: string) => {
    if (!productId) {
      setProductData(null);
      return;
    }
    
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
        
      if (productError) throw productError;
      
      // Also fetch wallet addresses for the product
      const { data: walletData, error: walletError } = await supabase
        .from('wallet_addresses')
        .select('*')
        .eq('product_id', productId);
        
      if (walletError) throw walletError;
      
      // Combine the data
      const fullProductData = {
        ...productData,
        wallet_addresses: walletData || []
      };
      
      console.log("Fetched product data:", fullProductData);
      setProductData(fullProductData);
    } catch (error) {
      console.error('Error fetching product info:', error);
      setProductData(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => (
          <div 
            key={ad.id} 
            className="glass-card overflow-hidden group cursor-pointer h-[600px]"
            onClick={() => handleAdClick(ad)}
          >
            <div className="h-80 bg-dark-secondary relative overflow-hidden">
              {ad.media_type === 'image' ? (
                <img 
                  src={ad.media_url} 
                  alt={ad.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <video 
                  src={ad.media_url} 
                  controls 
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-md flex items-center text-xs">
                {ad.media_type === 'image' ? (
                  <><Image size={12} className="mr-1" /> Image</>
                ) : (
                  <><Video size={12} className="mr-1" /> Video</>
                )}
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-medium line-clamp-2 mb-2">{ad.title}</h3>
              
              {ad.industry && (
                <div className="text-xs text-muted-foreground mb-3 flex items-center">
                  <Tags size={12} className="mr-1" />
                  <span>{ad.industry}</span>
                </div>
              )}
              
              {ad.product_url && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full flex items-center justify-center"
                  asChild
                >
                  <Link to={`/marketplace?product=${ad.product_url}`}>
                    <ExternalLink size={14} className="mr-1" />
                    View Product
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl bg-background">
          <DialogTitle className="sr-only">Product Details</DialogTitle>
          {selectedAd && selectedAd.product_url && productData && (
            <ProductCard 
              product={productData}
              showBuyButton={true}
              onClick={() => {}}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdDisplay;
