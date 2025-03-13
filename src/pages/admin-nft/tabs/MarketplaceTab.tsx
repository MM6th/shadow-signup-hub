
import React, { useEffect } from 'react';
import { Plus, Edit, DollarSign, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNFT, NFT } from '@/hooks/useNFT';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { NFTCard } from '../components/NFTCard';
import { EmptyState } from '../components/EmptyState';

interface MarketplaceTabProps {
  nfts: NFT[];
  isLoading: boolean;
  onCreateNFT: () => void;
  onEditNFT: (nft: NFT) => void;
  refreshData: () => Promise<void>;
}

export const MarketplaceTab: React.FC<MarketplaceTabProps> = ({ 
  nfts, 
  isLoading, 
  onCreateNFT,
  onEditNFT,
  refreshData
}) => {
  const { simulateMintNFT, listNFTForSale, deleteNFT } = useNFT();
  const { wallet } = useWallet();
  const { toast } = useToast();

  useEffect(() => {
    console.log("MarketplaceTab received NFTs:", nfts.length, nfts);
  }, [nfts]);

  const handleMintNFT = async (nftId: string) => {
    if (!wallet.isConnected) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your wallet to mint NFTs',
        variant: 'destructive',
      });
      return;
    }
    
    await simulateMintNFT(nftId);
    // Add a longer delay before refreshing to ensure DB consistency
    setTimeout(() => refreshData(), 2000);
  };

  const handleListNFT = async (nftId: string, price: number) => {
    if (!wallet.isConnected) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your wallet to list NFTs',
        variant: 'destructive',
      });
      return;
    }
    
    await listNFTForSale(nftId, price);
    // Add a longer delay before refreshing to ensure DB consistency
    setTimeout(() => refreshData(), 2000);
  };

  const handleDeleteNFT = async (nftId: string) => {
    const success = await deleteNFT(nftId);
    if (success) {
      // Refresh data after deletion
      setTimeout(() => refreshData(), 1000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">Your NFTs</h2>
        <Button onClick={onCreateNFT}>
          <Plus size={16} className="mr-2" /> Create NFT
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Loading NFTs...</p>
        </div>
      ) : nfts.length === 0 ? (
        <EmptyState 
          title="No NFTs Found"
          description="You haven't created any NFTs yet. Create your first NFT by clicking the button above."
          buttonText="Create Your First NFT"
          onClick={onCreateNFT}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map(nft => (
            <NFTCard 
              key={nft.id}
              nft={nft}
              onMint={handleMintNFT}
              onList={handleListNFT}
              onEdit={onEditNFT}
              onDelete={handleDeleteNFT}
            />
          ))}
        </div>
      )}
    </div>
  );
};
