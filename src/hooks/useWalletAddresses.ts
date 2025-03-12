
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';

export const useWalletAddresses = (
  user: User | null,
  productId: string,
  isAdminUser: boolean
) => {
  const [adminWalletAddresses, setAdminWalletAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch admin wallet addresses when component mounts
    const fetchAdminWalletAddresses = async () => {
      try {
        setIsLoading(true);
        // First, try to find the admin user
        const { data: adminData, error: adminError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user?.id)
          .single();

        if (adminError || !adminData) {
          console.error('Error finding admin user', adminError);
          return;
        }

        // Fetch all products by the admin
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id')
          .eq('user_id', isAdminUser ? user?.id : adminData.id);

        if (productsError || !products) {
          console.error('Error finding admin products', productsError);
          return;
        }

        // If this product belongs to the admin, fetch its wallet addresses
        if (isAdminUser) {
          const { data: walletData, error: walletError } = await supabase
            .from('wallet_addresses')
            .select('*')
            .eq('product_id', productId);

          if (!walletError && walletData) {
            setAdminWalletAddresses(walletData);
          }
        } else {
          // For non-admin users, fetch all admin wallet addresses
          if (products.length > 0) {
            // Get all admin product IDs
            const productIds = products.map(p => p.id);
            
            // Fetch wallet addresses for any admin product
            const { data: walletData, error: walletError } = await supabase
              .from('wallet_addresses')
              .select('*')
              .in('product_id', productIds);

            if (!walletError && walletData && walletData.length > 0) {
              // Get the first wallet address of each crypto type
              const uniqueWallets: Record<string, any> = {};
              walletData.forEach(wallet => {
                if (!uniqueWallets[wallet.crypto_type]) {
                  uniqueWallets[wallet.crypto_type] = wallet;
                }
              });
              
              setAdminWalletAddresses(Object.values(uniqueWallets));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching admin wallet addresses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchAdminWalletAddresses();
    } else {
      setIsLoading(false);
    }
  }, [user, productId, isAdminUser]);

  return { adminWalletAddresses, isLoading };
};
