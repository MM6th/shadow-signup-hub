
import React from 'react';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NFTCollection } from '@/hooks/useNFT';
import { CollectionCard } from '../components/CollectionCard';
import { EmptyState } from '../components/EmptyState';

interface CollectionsTabProps {
  collections: NFTCollection[];
  isLoading: boolean;
  onCreateCollection: () => void;
  onViewDetails: (collection: NFTCollection) => void;
}

export const CollectionsTab: React.FC<CollectionsTabProps> = ({ 
  collections, 
  isLoading, 
  onCreateCollection,
  onViewDetails
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">Your Collections</h2>
        <Button onClick={onCreateCollection}>
          <Plus size={16} className="mr-2" /> Create Collection
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Loading collections...</p>
        </div>
      ) : collections.length === 0 ? (
        <EmptyState 
          title="No Collections Found"
          description="You haven't created any collections yet. Create your first collection by clicking the button above."
          buttonText="Create Your First Collection"
          onClick={onCreateCollection}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map(collection => (
            <CollectionCard 
              key={collection.id}
              collection={collection}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};
