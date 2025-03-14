
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface NFT {
  id: string;
  title: string;
  description: string;
  price: number;
  imageurl: string; // Changed from imageUrl to imageurl to match DB column
  tokenid: string | null; // Changed from tokenId to tokenid to match DB column
  collection: string;
  created_at: string;
  owner_id: string;
  blockchain: string;
  status: 'draft' | 'minting' | 'minted' | 'listed' | 'sold';
  currency?: string; // Add currency field
}

export interface NFTCollection {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  image_url: string | null;
}

export const useNFT = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchNFTs = async (userId?: string) => {
    try {
      setIsLoading(true);
      
      // Use the custom query builder for the new nfts table
      let query = supabase.from('nfts').select('*');
      
      if (userId) {
        query = query.eq('owner_id', userId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Explicitly cast the data to NFT[] type
      const typedData = data as unknown as NFT[];
      setNfts(typedData);
      return typedData;
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      toast({
        title: 'Failed to load NFTs',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCollections = async (userId?: string) => {
    try {
      setIsLoading(true);
      
      // Use the custom query builder for the new nft_collections table
      let query = supabase.from('nft_collections').select('*');
      
      if (userId) {
        query = query.eq('owner_id', userId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Explicitly cast the data to NFTCollection[] type
      const typedData = data as unknown as NFTCollection[];
      setCollections(typedData);
      return typedData;
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

  const createNFT = async (nftData: Omit<NFT, 'id' | 'created_at' | 'tokenid' | 'status' | 'owner_id'>) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to create an NFT',
        variant: 'destructive',
      });
      return null;
    }
    
    try {
      setIsLoading(true);
      
      // First, store the NFT metadata in our database
      // Ensure property names match the database column names
      const { data, error } = await supabase
        .from('nfts')
        .insert({
          title: nftData.title,
          description: nftData.description,
          price: nftData.price,
          imageurl: nftData.imageurl, // Changed from imageUrl to imageurl
          collection: nftData.collection,
          owner_id: user.id,
          blockchain: nftData.blockchain || 'ethereum',
          status: 'draft'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'NFT Created',
        description: 'Your NFT has been created successfully and is ready to mint',
      });
      
      // Return the created NFT
      return data as unknown as NFT;
      
      // Note: In a real implementation, this is where we would 
      // call a smart contract to mint the NFT on the blockchain
      // and then update the tokenId and status in our database
      
    } catch (error) {
      console.error('Error creating NFT:', error);
      toast({
        title: 'Failed to create NFT',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      return null;
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

  // For demonstration purposes - in a real implementation,
  // this would interact with blockchain via web3 libraries
  const simulateMintNFT = async (nftId: string) => {
    try {
      setIsLoading(true);
      
      // Update the NFT status to minting
      await supabase
        .from('nfts')
        .update({ status: 'minting' })
        .eq('id', nftId);
      
      // Simulate blockchain transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a fake token ID
      const tokenId = Math.floor(Math.random() * 1000000).toString();
      
      // Update the NFT with token ID and set status to minted
      // Make sure to use 'tokenid' (not 'tokenId') to match the database column
      const { data, error } = await supabase
        .from('nfts')
        .update({ 
          tokenid: tokenId, // Changed from tokenId to tokenid
          status: 'minted' 
        })
        .eq('id', nftId)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'NFT Minted',
        description: `Your NFT has been minted with token ID: ${tokenId}`,
      });
      
      return data as unknown as NFT;
    } catch (error) {
      console.error('Error minting NFT:', error);
      toast({
        title: 'Failed to mint NFT',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const listNFTForSale = async (nftId: string, price: number, currency: string = 'ethereum') => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('nfts')
        .update({ 
          price,
          currency,
          status: 'listed' 
        })
        .eq('id', nftId)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'NFT Listed',
        description: `Your NFT has been listed for sale at ${price} ${currency.toUpperCase()}`,
      });
      
      return data as unknown as NFT;
    } catch (error) {
      console.error('Error listing NFT:', error);
      toast({
        title: 'Failed to list NFT',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    nfts,
    collections,
    isLoading,
    fetchNFTs,
    fetchCollections,
    createNFT,
    createCollection,
    simulateMintNFT,
    listNFTForSale
  };
};
