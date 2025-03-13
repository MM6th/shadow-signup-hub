
import React from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NFTCollection } from '@/hooks/useNFT';

interface CollectionDetailsDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  collection: NFTCollection | null;
  onAddNFT: () => void;
}

export const CollectionDetailsDialog: React.FC<CollectionDetailsDialogProps> = ({
  isOpen,
  setIsOpen,
  collection,
  onAddNFT
}) => {
  if (!collection) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-dark-secondary border-gray-700 text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle>{collection.name}</DialogTitle>
          <DialogDescription>
            {collection.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-4">NFTs in this Collection</h3>
          
          {!collection.nfts || collection.nfts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-pi-muted">No NFTs in this collection yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {collection.nfts.map(nft => (
                <div key={nft.id} className="glass-card rounded-lg overflow-hidden border border-white/10 flex">
                  <div className="w-1/3 bg-dark-secondary overflow-hidden">
                    <img 
                      src={nft.imageurl} 
                      alt={nft.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 w-2/3">
                    <h4 className="font-medium text-base mb-1">{nft.title}</h4>
                    <p className="text-pi-muted text-xs mb-2 line-clamp-2">
                      {nft.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-amber-400">{nft.price} ETH</span>
                      <span className="text-xs bg-dark px-2 py-1 rounded-full">
                        {nft.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
          <Button onClick={onAddNFT}>
            <Plus size={16} className="mr-2" /> Add NFT to Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
