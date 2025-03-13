
import React from 'react';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NFTCollection } from '@/hooks/useNFT';

interface CollectionCardProps {
  collection: NFTCollection;
  onViewDetails: (collection: NFTCollection) => void;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({ 
  collection, 
  onViewDetails 
}) => {
  return (
    <div className="glass-card rounded-lg overflow-hidden border border-white/10">
      <div className="h-40 bg-dark-secondary overflow-hidden relative">
        {collection.image_url ? (
          <img 
            src={collection.image_url} 
            alt={collection.name} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-secondary to-dark">
            <Package size={48} className="text-pi-muted" />
          </div>
        )}
        {collection.nfts && collection.nfts.length > 0 && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium bg-black/50">
            {collection.nfts.length} NFT{collection.nfts.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-lg mb-2">{collection.name}</h3>
        <p className="text-pi-muted text-sm mb-4 line-clamp-3">
          {collection.description}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-pi-muted">
            Created: {new Date(collection.created_at).toLocaleDateString()}
          </span>
          <Button variant="outline" size="sm" onClick={() => onViewDetails(collection)}>
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};
