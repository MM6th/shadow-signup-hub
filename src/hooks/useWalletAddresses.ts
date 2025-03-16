
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

export const useWalletAddresses = (
  user: User | null,
  productId: string,
  isAdminUser: boolean
) => {
  const [adminWalletAddresses, setAdminWalletAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPayPalEnabled, setHasPayPalEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch wallet addresses and payment methods for the specific product
    const fetchWalletAddresses = async () => {
      try {
        setIsLoading(true);
        
        // First, get the product details to check for PayPal
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('enable_paypal, paypal_client_id')
          .eq('id', productId)
          .single();

        if (productError) {
          console.error('Error fetching product details:', productError);
          setIsLoading(false);
          return;
        }

        // Set PayPal status
        setHasPayPalEnabled(
          productData?.enable_paypal && !!productData?.paypal_client_id
        );
        
        // Get wallet addresses for this specific product
        const { data: walletData, error: walletError } = await supabase
          .from('wallet_addresses')
          .select('*')
          .eq('product_id', productId);

        if (walletError) {
          console.error('Error fetching wallet addresses:', walletError);
          toast({
            title: "Error",
            description: "Could not fetch payment information",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (walletData && walletData.length > 0) {
          console.log('Found wallet addresses for product:', walletData);
          setAdminWalletAddresses(walletData);
          setIsLoading(false);
          return;
        }

        // No wallet addresses found for this specific product
        setAdminWalletAddresses([]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error in fetchWalletAddresses:', error);
        setIsLoading(false);
      }
    };

    fetchWalletAddresses();
  }, [user, productId, toast]);

  return { adminWalletAddresses, hasPayPalEnabled, isLoading };
};
