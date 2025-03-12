
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductForm from '@/components/ProductForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const EditProduct = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [walletAddresses, setWalletAddresses] = useState([]);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  
  const ADMIN_EMAIL = "cmooregee@gmail.com";
  const isAdminUser = user?.email === ADMIN_EMAIL;
  
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || !user) return;
      
      try {
        setIsLoadingProduct(true);
        
        if (!isAdminUser) {
          toast({
            title: "Access restricted",
            description: "Only administrators can edit products",
            variant: "destructive",
          });
          navigate('/marketplace');
          return;
        }
        
        // Fetch product data
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
          
        if (productError) {
          throw productError;
        }
        
        if (!productData) {
          toast({
            title: "Product not found",
            description: "This product doesn't exist",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }
        
        setProduct(productData);
        
        // Fetch wallet addresses
        const { data: walletData, error: walletError } = await supabase
          .from('wallet_addresses')
          .select('*')
          .eq('product_id', productId);
          
        if (walletError) {
          throw walletError;
        }
        
        // Transform wallet data to the format ProductForm expects
        const formattedWallets = walletData.map(wallet => ({
          id: wallet.id,
          cryptoType: wallet.crypto_type,
          address: wallet.wallet_address
        }));
        
        setWalletAddresses(formattedWallets);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast({
          title: "Error loading product",
          description: "There was a problem loading the product details.",
          variant: "destructive",
        });
        navigate('/dashboard');
      } finally {
        setIsLoadingProduct(false);
      }
    };
    
    fetchProduct();
  }, [productId, user, toast, navigate, isAdminUser]);
  
  if (isLoading || isLoadingProduct) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    navigate('/');
    return null;
  }
  
  if (!isAdminUser) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-dark bg-dark-gradient text-pi py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center mb-4 text-pi-muted hover:text-pi"
          >
            <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-elixia text-gradient">Edit Product</h1>
          <p className="text-pi-muted">Update your product details in the cosmic marketplace.</p>
        </div>
        
        {product && (
          <ProductForm 
            initialValues={product}
            initialWalletAddresses={walletAddresses}
            isEditing={true}
          />
        )}
      </div>
    </div>
  );
};

export default EditProduct;
