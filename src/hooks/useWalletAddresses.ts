
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
    // Fetch admin wallet addresses when component mounts
    const fetchAdminWalletAddresses = async () => {
      try {
        setIsLoading(true);
        
        // Get the admin user ID (always fetch from the user with email cmooregee@gmail.com)
        const { data: adminData, error: adminError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', isAdminUser ? user?.id : null)
          .maybeSingle();

        if (adminError) {
          console.error('Error finding admin user', adminError);
          return;
        }

        if (!adminData && !isAdminUser) {
          // If we're not the admin and couldn't find the admin profile,
          // try to find any products created by users with admin capabilities
          const { data: adminUserData } = await supabase.auth.admin.listUsers();
          
          if (adminUserData && adminUserData.users) {
            // Find the admin user
            // TypeScript fix: Properly check and type the users array
            const adminUser = adminUserData.users.find(u => {
              // Check if u has email property and if it matches the admin email
              if (u && typeof u === 'object' && 'email' in u) {
                return u.email === 'cmooregee@gmail.com';
              }
              return false;
            });
            
            if (adminUser) {
              // Fetch all products by the admin
              const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id')
                .eq('user_id', adminUser.id);

              if (productsError || !products || products.length === 0) {
                console.error('Error finding admin products', productsError);
                toast({
                  title: "No payment options available",
                  description: "Please try again later or contact support",
                  variant: "destructive",
                });
                return;
              }

              // Get the first wallet address of each crypto type for the admin's products
              const { data: walletData, error: walletError } = await supabase
                .from('wallet_addresses')
                .select('*')
                .in('product_id', products.map(p => p.id));

              if (walletError) {
                console.error('Error fetching admin wallet addresses', walletError);
                return;
              }

              if (walletData && walletData.length > 0) {
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
        } else {
          // For admin users or if we found the admin profile, proceed normally
          let targetUserId = isAdminUser ? user?.id : adminData?.id;
          
          if (!targetUserId) {
            console.error('Could not determine target user ID');
            return;
          }

          // Fetch all products by the target user
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id')
            .eq('user_id', targetUserId);

          if (productsError || !products) {
            console.error('Error finding products', productsError);
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
  }, [user, productId, isAdminUser, toast]);

  return { adminWalletAddresses, isLoading };
};
