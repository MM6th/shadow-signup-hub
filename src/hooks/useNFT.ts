
// Re-export types from the types file
export * from './nft/types';

// Combine the functionality of both hooks
import { useState, useEffect } from 'react';
import { useNFTOperations } from './nft/useNFTOperations';
import { useNFTCollections } from './nft/useNFTCollections';

export const useNFT = () => {
  const nftOperations = useNFTOperations();
  const nftCollections = useNFTCollections();
  
  // Determine if either hook is in a loading state
  const isLoading = nftOperations.isLoading || nftCollections.isLoading;
  
  return {
    // From useNFTOperations
    nfts: nftOperations.nfts,
    fetchNFTs: nftOperations.fetchNFTs,
    createNFT: nftOperations.createNFT,
    updateNFT: nftOperations.updateNFT,
    deleteNFT: nftOperations.deleteNFT, // Add the delete function
    simulateMintNFT: nftOperations.simulateMintNFT,
    listNFTForSale: nftOperations.listNFTForSale,
    
    // From useNFTCollections
    collections: nftCollections.collections,
    fetchCollections: nftCollections.fetchCollections,
    createCollection: nftCollections.createCollection,
    getNFTsByCollection: nftCollections.getNFTsByCollection,
    
    // Combined loading state
    isLoading
  };
};
