
import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Wallet, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useUserSession } from '@/hooks/useUserSession';
import { useNFT, NFT, NFTCollection } from '@/hooks/useNFT';
import { useWallet } from '@/hooks/useWallet';
import { MarketplaceTab } from './tabs/MarketplaceTab';
import { CollectionsTab } from './tabs/CollectionsTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { NFTFormDialog } from './dialogs/NFTFormDialog';
import { CollectionFormDialog } from './dialogs/CollectionFormDialog';
import { CollectionDetailsDialog } from './dialogs/CollectionDetailsDialog';

const ADMIN_EMAILS = ['cmooregee@gmail.com'];

export const AdminNFTPage: React.FC = () => {
  const { user, isLoading: authLoading } = useUserSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { wallet, connectWallet, isMetaMaskInstalled } = useWallet();
  const { 
    nfts, 
    collections,
    isLoading: nftLoading,
    fetchNFTs,
    fetchCollections,
    getNFTsByCollection
  } = useNFT();
  
  const [isNFTDialogOpen, setIsNFTDialogOpen] = useState(false);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<NFTCollection | null>(null);
  const [isCollectionDetailsOpen, setIsCollectionDetailsOpen] = useState(false);
  
  const [currentNFT, setCurrentNFT] = useState<Partial<NFT>>({});
  const [currentCollection, setCurrentCollection] = useState<Partial<NFTCollection>>({});
  
  const [activeTab, setActiveTab] = useState<string>('marketplace');
  const [salesData, setSalesData] = useState<{date: string; sales: number}[]>([]);

  useEffect(() => {
    if (user) {
      // Force a complete refresh of NFTs and collections data
      fetchNFTs(user.id).then(() => {
        console.log("NFTs fetched successfully");
      }).catch(error => {
        console.error("Error fetching NFTs:", error);
      });
      
      fetchCollections(user.id).then(() => {
        console.log("Collections fetched successfully");
      }).catch(error => {
        console.error("Error fetching collections:", error);
      });
      
      const mockSalesData = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          sales: Math.floor(Math.random() * 10)
        };
      });
      setSalesData(mockSalesData);
    }
  }, [user]);

  const handleCreateNFT = () => {
    setIsEditing(false);
    setCurrentNFT({});
    setIsNFTDialogOpen(true);
  };

  const handleEditNFT = (nft: NFT) => {
    setIsEditing(true);
    setCurrentNFT({...nft});
    setIsNFTDialogOpen(true);
  };

  const handleCreateCollection = () => {
    setCurrentCollection({});
    setIsCollectionDialogOpen(true);
  };

  const handleCreateCollectionFromNFTDialog = () => {
    setIsNFTDialogOpen(false);
    setCurrentCollection({});
    setIsCollectionDialogOpen(true);
  };

  const onCollectionCreated = () => {
    setIsCollectionDialogOpen(false);
    setIsNFTDialogOpen(true);
  };

  const viewCollectionDetails = async (collection: NFTCollection) => {
    setSelectedCollection(collection);
    
    try {
      // Always fetch the latest NFTs for this collection, even if we have them cached
      const collectionNFTs = await getNFTsByCollection(collection.name);
      console.log(`Fetched ${collectionNFTs.length} NFTs for collection ${collection.name}:`, collectionNFTs);
      
      setSelectedCollection({
        ...collection,
        nfts: collectionNFTs
      });
      
      setIsCollectionDetailsOpen(true);
    } catch (error) {
      console.error(`Error fetching NFTs for collection ${collection.name}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to load collection NFTs',
        variant: 'destructive',
      });
    }
  };

  const closeNFTDialog = () => {
    setIsNFTDialogOpen(false);
    setCurrentNFT({});
  };

  const refreshData = async () => {
    if (user) {
      try {
        // Ensure we completely refresh all data
        const [updatedNFTs, updatedCollections] = await Promise.all([
          fetchNFTs(user.id),
          fetchCollections(user.id)
        ]);
        
        console.log("Data refreshed successfully:", {
          nfts: updatedNFTs.length,
          collections: updatedCollections.length
        });
      } catch (error) {
        console.error("Error refreshing data:", error);
        toast({
          title: 'Error',
          description: 'Failed to refresh data',
          variant: 'destructive',
        });
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    console.log("Access denied. User email:", user?.email);
    toast({
      title: "Access Denied",
      description: "You do not have permission to view this page.",
      variant: "destructive",
    });
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-dark py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-elixia text-gradient">NFT Management</h1>
            <p className="text-pi-muted mt-2">
              Create and manage your NFT collections and marketplace
            </p>
          </div>
          <div className="flex gap-4">
            {!wallet.isConnected ? (
              <Button variant="outline" onClick={connectWallet} disabled={!isMetaMaskInstalled()}>
                <Wallet size={16} className="mr-2" /> 
                {isMetaMaskInstalled() ? 'Connect Wallet' : 'Install MetaMask'}
              </Button>
            ) : (
              <div className="glass-card px-4 py-2 rounded-md flex items-center">
                <Wallet size={16} className="mr-2 text-green-400" />
                <span className="text-sm text-pi-muted">
                  {wallet.address?.substring(0, 6)}...{wallet.address?.substring(wallet.address.length - 4)}&nbsp;
                </span>
                <span className="text-sm font-medium">{wallet.balance} ETH</span>
              </div>
            )}
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
        
        <div className="glass-card rounded-xl p-6 mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              <TabsTrigger value="collections">Collections</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="marketplace">
              <MarketplaceTab 
                nfts={nfts}
                isLoading={nftLoading}
                onCreateNFT={handleCreateNFT}
                onEditNFT={handleEditNFT}
                refreshData={refreshData}
              />
            </TabsContent>
            
            <TabsContent value="collections">
              <CollectionsTab 
                collections={collections}
                isLoading={nftLoading}
                onCreateCollection={handleCreateCollection}
                onViewDetails={viewCollectionDetails}
              />
            </TabsContent>
            
            <TabsContent value="analytics">
              <AnalyticsTab 
                nfts={nfts} 
                salesData={salesData} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <NFTFormDialog 
        isOpen={isNFTDialogOpen}
        setIsOpen={setIsNFTDialogOpen}
        isEditing={isEditing}
        currentNFT={currentNFT}
        collections={collections}
        onCreateCollection={handleCreateCollectionFromNFTDialog}
        onClose={closeNFTDialog}
        refreshData={refreshData}
      />

      <CollectionFormDialog 
        isOpen={isCollectionDialogOpen}
        setIsOpen={setIsCollectionDialogOpen}
        currentCollection={currentCollection}
        setCurrentCollection={setCurrentCollection}
        onSuccess={onCollectionCreated}
        isNFTDialogOpen={isNFTDialogOpen}
        refreshData={refreshData}
      />

      <CollectionDetailsDialog 
        isOpen={isCollectionDetailsOpen}
        setIsOpen={setIsCollectionDetailsOpen}
        collection={selectedCollection}
        onAddNFT={() => {
          setIsNFTDialogOpen(true);
          setCurrentNFT({ collection: selectedCollection?.name });
          setIsCollectionDetailsOpen(false);
        }}
      />
    </div>
  );
};
