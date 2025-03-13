
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  user_id: string;
  created_at: string;
  category: string;
  type: string;
  contact_phone?: string;
}

export const useProduct = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchProducts = async (searchTerm: string = '', category: string = 'all', type: string = 'all') => {
    try {
      setIsLoading(true);
      
      let query = supabase.from('products').select('*');
      
      // Apply filters if they are not 'all'
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      
      if (type && type !== 'all') {
        query = query.eq('type', type);
      }
      
      // Order by creation date, most recent first
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;

      // Apply search term filter in memory (more flexible)
      let filteredProducts = data || [];
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.title.toLowerCase().includes(term) || 
          product.description.toLowerCase().includes(term)
        );
      }
      
      setProducts(filteredProducts as Product[]);
      return filteredProducts;
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Failed to load products',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'user_id'>, userId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...productData,
          user_id: userId
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Product Created',
        description: 'Your product has been created successfully',
      });
      
      // Refresh products list
      await fetchProducts();
      
      return data as Product;
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: 'Failed to create product',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    products,
    isLoading,
    fetchProducts,
    createProduct
  };
};
