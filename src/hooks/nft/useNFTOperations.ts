
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { NFT } from './types';
import { deleteFileFromStorage } from '@/pages/admin-nft/utils/imageUtils';

export const useNFTOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchNFTs = async (userId?: string) => {
    try {
      setIsLoading(true);
      
      let query = supabase.from('nfts').select('*');
      
      if (userId) {
        query = query.eq('owner_id', userId);
      } else if (user) {
        query = query.eq('owner_id', user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const typedData = data as unknown as NFT[];
      console.log('Fetched NFTs:', typedData.length, typedData);
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
      
      const { data, error } = await supabase
        .from('nfts')
        .insert({
          title: nftData.title,
          description: nftData.description,
          price: nftData.price,
          imageurl: nftData.imageurl,
          collection: nftData.collection,
          owner_id: user.id,
          blockchain: nftData.blockchain || 'ethereum',
          status: 'draft',
          currency: nftData.currency || 'eth',
          content_type: nftData.content_type || 'image',
          file_url: nftData.file_url || null,
          file_type: nftData.file_type || null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'NFT Created',
        description: 'Your NFT has been created successfully and is ready to mint',
      });
      
      return data as unknown as NFT;
      
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

  const updateNFT = async (nftData: Partial<NFT> & { id: string }) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to update an NFT',
        variant: 'destructive',
      });
      return null;
    }
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('nfts')
        .update({
          title: nftData.title,
          description: nftData.description,
          price: nftData.price,
          imageurl: nftData.imageurl,
          collection: nftData.collection,
          blockchain: nftData.blockchain,
          currency: nftData.currency || 'eth',
          content_type: nftData.content_type || 'image',
          file_url: nftData.file_url,
          file_type: nftData.file_type
        })
        .eq('id', nftData.id)
        .eq('owner_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data as unknown as NFT;
    } catch (error) {
      console.error('Error updating NFT:', error);
      toast({
        title: 'Failed to update NFT',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const simulateMintNFT = async (nftId: string) => {
    try {
      setIsLoading(true);
      
      await supabase
        .from('nfts')
        .update({ status: 'minting' })
        .eq('id', nftId);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const tokenId = Math.floor(Math.random() * 1000000).toString();
      
      const { data, error } = await supabase
        .from('nfts')
        .update({ 
          tokenid: tokenId,
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
      
      await fetchNFTs(user?.id);
      
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

  const deleteNFT = async (nftId: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to delete an NFT',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      setIsLoading(true);
      console.log("Starting deletion process for NFT ID:", nftId);
      
      // First, fetch the NFT to get file information
      const { data: nftData, error: fetchError } = await supabase
        .from('nfts')
        .select('*')
        .eq('id', nftId)
        .eq('owner_id', user.id)
        .single();
      
      if (fetchError) {
        console.error("Error fetching NFT details:", fetchError);
        throw fetchError;
      }
      
      const nft = nftData as unknown as NFT;
      console.log("Found NFT to delete:", nft);
      
      // Delete the NFT record from the database first
      const { error } = await supabase
        .from('nfts')
        .delete()
        .eq('id', nftId)
        .eq('owner_id', user.id);
      
      if (error) {
        console.error("Error deleting NFT record:", error);
        throw error;
      }
      
      console.log("NFT database record deleted successfully");
      
      // Update the local state to remove the deleted NFT
      setNfts(prevNfts => prevNfts.filter(nft => nft.id !== nftId));
      
      // Now try to delete associated files
      let fileDeleteResults = [];
      
      // Delete image file if it exists
      if (nft.imageurl) {
        console.log("Attempting to delete image file:", nft.imageurl);
        const imageDeleted = await deleteFileFromStorage(nft.imageurl);
        fileDeleteResults.push({ type: 'image', success: imageDeleted });
      }
      
      // Delete additional file if it exists (for non-image content types)
      if (nft.file_url && nft.content_type !== 'image') {
        console.log("Attempting to delete additional file:", nft.file_url);
        const fileDeleted = await deleteFileFromStorage(nft.file_url);
        fileDeleteResults.push({ type: 'file', success: fileDeleted });
      }
      
      console.log("File deletion results:", fileDeleteResults);
      
      toast({
        title: 'NFT Deleted',
        description: 'The NFT has been successfully removed from your collection',
        variant: 'default',
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting NFT:', error);
      toast({
        title: 'Failed to delete NFT',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const listNFTForSale = async (nftId: string, price: number) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('nfts')
        .update({ 
          price,
          status: 'listed' 
        })
        .eq('id', nftId)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'NFT Listed',
        description: `Your NFT has been listed for sale at ${price} ETH`,
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
    isLoading,
    fetchNFTs,
    createNFT,
    updateNFT,
    deleteNFT,
    simulateMintNFT,
    listNFTForSale
  };
};
