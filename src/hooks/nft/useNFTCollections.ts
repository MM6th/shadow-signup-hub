
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { NFTCollection, NFT } from './types';

export const useNFTCollections = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCollections = async (userId?: string) => {
    try {
      setIsLoading(true);
      
      // Use the custom query builder for the new nft_collections table
      let query = supabase.from('nft_collections').select('*');
      
      if (userId) {
        query = query.eq('owner_id', userId);
      } else if (user) {
        // If no userId provided but user is logged in, fetch their collections
        query = query.eq('owner_id', user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Explicitly cast the data to NFTCollection[] type
      const typedData = data as unknown as NFTCollection[];
      
      // After getting collections, let's get the NFTs for each collection
      const collectionsWithNFTs = await Promise.all(
        typedData.map(async (collection) => {
          const { data: collectionNFTs, error: nftError } = await supabase
            .from('nfts')
            .select('*')
            .eq('collection', collection.name)
            .order('created_at', { ascending: false });
            
          if (nftError) {
            console.error('Error fetching collection NFTs:', nftError);
            return { ...collection, nfts: [] };
          }
          
          return {
            ...collection,
            nfts: collectionNFTs as unknown as NFT[]
          };
        })
      );
      
      setCollections(collectionsWithNFTs);
      return collectionsWithNFTs;
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast({
        title: 'Failed to load collections',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createCollection = async (collectionData: Omit<NFTCollection, 'id' | 'created_at' | 'owner_id'>) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to create a collection',
        variant: 'destructive',
      });
      return null;
    }
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('nft_collections')
        .insert({
          name: collectionData.name,
          description: collectionData.description,
          image_url: collectionData.image_url,
          owner_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Collection Created',
        description: 'Your collection has been created successfully',
      });
      
      return data as unknown as NFTCollection;
    } catch (error) {
      console.error('Error creating collection:', error);
      toast({
        title: 'Failed to create collection',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getNFTsByCollection = async (collectionName: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('nfts')
        .select('*')
        .eq('collection', collectionName)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      console.log(`Fetched ${data.length} NFTs for collection "${collectionName}":`, data);
      return data as unknown as NFT[];
    } catch (error) {
      console.error('Error fetching collection NFTs:', error);
      toast({
        title: 'Failed to load collection NFTs',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    collections,
    isLoading,
    fetchCollections,
    createCollection,
    getNFTsByCollection
  };
};
