
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, FileAudio, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AudioDownload = () => {
  const { productId } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchaseVerified, setIsPurchaseVerified] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access your purchases",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        
        // Fetch the product details
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*, wallet_addresses(*)')
          .eq('id', productId)
          .single();
          
        if (productError) throw productError;
        
        setProduct(productData);
        
        // Verify purchase status
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('purchases')
          .select('*')
          .eq('product_id', productId)
          .eq('buyer_id', user.id)
          .eq('status', 'completed')
          .single();
          
        if (purchaseError && purchaseError.code !== 'PGRST116') {
          throw purchaseError;
        }
        
        if (purchaseData) {
          setIsPurchaseVerified(true);
          setPurchaseStatus('verified');
        } else {
          setPurchaseStatus('failed');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast({
          title: "Error",
          description: "Failed to load product information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId, user, toast, navigate]);

  const handleDownload = async (url: string, fileName: string) => {
    try {
      // Create a link element
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Record download activity
      await supabase.from('download_activity').insert({
        product_id: productId,
        user_id: user?.id,
        file_url: url,
        file_name: fileName
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the file",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Loading your purchase...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-6 text-center">
            <h1 className="text-2xl font-elixia text-gradient mb-4">Product Not Found</h1>
            <p className="text-pi-muted mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
          </div>
        </div>
      </div>
    );
  }

  const isAudioProduct = 
    product.type === 'digital' && 
    product.digital_type === 'audio' && 
    product.audio_urls && 
    product.audio_urls.length > 0;

  if (!isAudioProduct) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-6 text-center">
            <h1 className="text-2xl font-elixia text-gradient mb-4">Not an Audio Product</h1>
            <p className="text-pi-muted mb-6">This product doesn't contain downloadable audio files.</p>
            <Button onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark bg-dark-gradient py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/marketplace')}
            className="flex items-center mb-4 text-pi-muted hover:text-pi"
          >
            Back to Marketplace
          </Button>
          
          <h1 className="text-3xl font-elixia text-gradient">Audio Downloads</h1>
          <p className="text-pi-muted mb-6">
            {product.title}{isPurchaseVerified ? ' - Your purchase has been verified' : ''}
          </p>
        </div>
        
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center mb-4">
            {isPurchaseVerified ? (
              <CheckCircle className="text-green-500 mr-2" size={24} />
            ) : (
              <Lock className="text-amber-500 mr-2" size={24} />
            )}
            <h2 className="text-xl font-elixia">
              {isPurchaseVerified ? 'Purchase Verified' : 'Purchase Verification'}
            </h2>
          </div>
          
          {!isPurchaseVerified && (
            <div className="bg-dark-secondary p-4 rounded-md mb-4">
              <p className="text-pi-muted mb-2">
                To access these audio files, you need to complete your purchase.
              </p>
              <Button onClick={() => navigate(`/marketplace`)}>
                View in Marketplace
              </Button>
            </div>
          )}
          
          {isPurchaseVerified && (
            <div className="space-y-4">
              <p className="text-pi-muted">
                Thank you for your purchase! You can now download your audio files.
              </p>
              
              {product.audio_file_names && product.audio_file_names.map((fileName: string, index: number) => (
                <Card key={index} className="bg-dark-secondary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileAudio className="text-pi-muted" size={24} />
                        <div>
                          <p className="font-medium truncate max-w-[200px] md:max-w-[300px]">
                            {fileName}
                          </p>
                          {product.artist_name && (
                            <p className="text-xs text-pi-muted">
                              {product.artist_name} {product.publishing_year ? `(${product.publishing_year})` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleDownload(product.audio_urls[index], fileName)}
                        variant="outline"
                        size="sm"
                      >
                        <Download size={16} className="mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {product.lyrics && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-2">Lyrics/Description:</h3>
                  <div className="bg-dark-secondary p-4 rounded whitespace-pre-wrap">
                    {product.lyrics}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioDownload;
