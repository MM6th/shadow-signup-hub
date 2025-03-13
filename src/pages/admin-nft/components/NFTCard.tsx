
import React from 'react';
import { DollarSign, Tag, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NFT } from '@/hooks/useNFT';

interface NFTCardProps {
  nft: NFT;
  onMint: (id: string) => void;
  onList: (id: string, price: number) => void;
  onEdit: (nft: NFT) => void;
}

export const NFTCard: React.FC<NFTCardProps> = ({ nft, onMint, onList, onEdit }) => {
  // Get the currency symbol in uppercase for display
  const currencySymbol = nft.currency ? nft.currency.toUpperCase() : 'ETH';
  
  return (
    <div className="glass-card rounded-lg overflow-hidden border border-white/10">
      <div className="h-48 bg-dark-secondary overflow-hidden relative">
        <img 
          src={nft.imageurl} 
          alt={nft.title} 
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
        <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium bg-black/50">
          {nft.status === 'draft' && 'Draft'}
          {nft.status === 'minting' && 'Minting...'}
          {nft.status === 'minted' && 'Minted'}
          {nft.status === 'listed' && 'Listed'}
          {nft.status === 'sold' && 'Sold'}
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-lg">{nft.title}</h3>
          <span className="flex items-center bg-dark-accent px-2 py-1 rounded text-sm">
            <DollarSign size={14} className="text-amber-400 mr-1" /> 
            {nft.price} {currencySymbol}
          </span>
        </div>
        
        <p className="text-pi-muted text-sm mb-4 line-clamp-2">
          {nft.description}
        </p>
        
        <div className="flex items-center text-xs text-pi-muted mb-4">
          <Tag size={14} className="mr-1" />
          <span>{nft.collection}</span>
          {nft.tokenid && (
            <span className="ml-2 px-2 py-0.5 bg-dark-secondary rounded-full">
              #{nft.tokenid}
            </span>
          )}
        </div>

        <div className="text-xs text-pi-muted mb-4">
          <span className="px-2 py-0.5 bg-dark-secondary rounded-full">
            {nft.blockchain.charAt(0).toUpperCase() + nft.blockchain.slice(1)}
          </span>
        </div>
        
        <div className="flex gap-2 justify-end">
          {nft.status === 'draft' && (
            <Button variant="outline" size="sm" onClick={() => onMint(nft.id)}>
              Mint NFT
            </Button>
          )}
          {nft.status === 'minted' && (
            <Button variant="outline" size="sm" onClick={() => onList(nft.id, nft.price)}>
              List for Sale
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onEdit(nft)}>
            <Edit size={14} className="mr-1" /> Edit
          </Button>
        </div>
      </div>
    </div>
  );
};
