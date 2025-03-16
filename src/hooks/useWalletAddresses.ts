
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
  const { toast } = useToast();

  useEffect(() => {
    // Fetch wallet addresses for the specific product
    const fetchWalletAddresses = async () => {
      try {
        setIsLoading(true);
        
        // First, try to get wallet addresses directly for this product
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

        // If no wallet addresses found for this product and user is logged in
        // We'll try to find some default wallet addresses
        if (user) {
          // Get any products with wallet addresses
          const { data: products } = await supabase
            .from('products')
            .select('id')
            .limit(10);
              
          if (products && products.length > 0) {
            // Try to get wallet addresses from any product
            const { data: allWalletData } = await supabase
              .from('wallet_addresses')
              .select('*')
              .in('product_id', products.map(p => p.id));
                
            if (allWalletData && allWalletData.length > 0) {
              // Get unique wallet addresses by crypto type
              const uniqueWallets: Record<string, any> = {};
              allWalletData.forEach(wallet => {
                if (!uniqueWallets[wallet.crypto_type]) {
                  uniqueWallets[wallet.crypto_type] = wallet;
                }
              });
                
              setAdminWalletAddresses(Object.values(uniqueWallets));
            }
          }
        }
      } catch (error) {
        console.error('Error in fetchWalletAddresses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletAddresses();
  }, [user, productId, toast]);

  return { adminWalletAddresses, isLoading };
};
