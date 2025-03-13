
import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Plus, Edit, Trash2, Image, Package, DollarSign, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Admin ID for authorization check
const ADMIN_ID = '3a25fea8-ec60-4e52-ae40-63f2b1ce89d9';

interface NFT {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  tokenId: string;
  collection: string;
  created_at: string;
}

const AdminNFT: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNFT, setCurrentNFT] = useState<Partial<NFT>>({});
  const [activeTab, setActiveTab] = useState<string>('marketplace');

  // Mock NFT data since we don't have an actual NFT table
  const mockNFTs: NFT[] = [
    {
      id: '1',
      title: 'Cosmic Wanderer #001',
      description: 'A unique digital collectible from the Cosmic Wanderers series.',
      price: 0.5,
      imageUrl: 'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a',
      tokenId: '001',
      collection: 'Cosmic Wanderers',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Ethereal Dreams #042',
      description: 'Part of the Ethereal Dreams collection, this NFT represents the boundary between reality and dreams.',
      price: 0.75,
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
      tokenId: '042',
      collection: 'Ethereal Dreams',
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Digital Genesis #003',
      description: 'The beginning of a new digital era captured in this one-of-a-kind NFT.',
      price: 1.2,
      imageUrl: 'https://images.unsplash.com/photo-1634986666676-ec9f8facce6a',
      tokenId: '003',
      collection: 'Digital Genesis',
      created_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    // Load mock NFTs
    setNfts(mockNFTs);
  }, []);

  // Check if user is admin
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (!user || user.id !== ADMIN_ID) {
    toast({
      title: "Access Denied",
      description: "You do not have permission to view this page.",
      variant: "destructive",
    });
    return <Navigate to="/dashboard" />;
  }

  const handleCreateNFT = () => {
    setCurrentNFT({});
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEditNFT = (nft: NFT) => {
    setCurrentNFT(nft);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteNFT = (id: string) => {
    // Filter out the deleted NFT
    setNfts(nfts.filter(nft => nft.id !== id));
    
    toast({
      title: "NFT Deleted",
      description: "The NFT has been successfully removed.",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentNFT.title || !currentNFT.description || !currentNFT.price) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (isEditing) {
      // Update existing NFT
      setNfts(nfts.map(nft => 
        nft.id === currentNFT.id ? { ...nft, ...currentNFT } as NFT : nft
      ));
      
      toast({
        title: "NFT Updated",
        description: "The NFT has been successfully updated.",
      });
    } else {
      // Create new NFT
      const newNFT: NFT = {
        id: Math.random().toString(36).substring(2, 9),
        title: currentNFT.title || 'Untitled NFT',
        description: currentNFT.description || 'No description provided',
        price: currentNFT.price || 0,
        imageUrl: currentNFT.imageUrl || 'https://via.placeholder.com/300',
        tokenId: currentNFT.tokenId || Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
        collection: currentNFT.collection || 'Default Collection',
        created_at: new Date().toISOString()
      };
      
      setNfts([newNFT, ...nfts]);
      
      toast({
        title: "NFT Created",
        description: "The NFT has been successfully created.",
      });
    }
    
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-dark py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-elixia text-gradient">NFT Management</h1>
            <p className="text-pi-muted mt-2">
              Manage your NFT collections and individual assets
            </p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
            <Button onClick={handleCreateNFT}>
              <Plus size={16} className="mr-2" /> Create NFT
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
            
            <TabsContent value="marketplace" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nfts.map(nft => (
                  <div key={nft.id} className="glass-card rounded-lg overflow-hidden border border-white/10">
                    <div className="h-48 bg-dark-secondary overflow-hidden relative">
                      <img 
                        src={nft.imageUrl} 
                        alt={nft.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-lg">{nft.title}</h3>
                        <span className="flex items-center bg-dark-accent px-2 py-1 rounded text-sm">
                          <DollarSign size={14} className="text-amber-400 mr-1" /> 
                          {nft.price} ETH
                        </span>
                      </div>
                      
                      <p className="text-pi-muted text-sm mb-4 line-clamp-2">
                        {nft.description}
                      </p>
                      
                      <div className="flex items-center text-xs text-pi-muted mb-4">
                        <Tag size={14} className="mr-1" />
                        <span>{nft.collection} #{nft.tokenId}</span>
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleEditNFT(nft)}>
                          <Edit size={14} className="mr-1" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteNFT(nft.id)}>
                          <Trash2 size={14} className="mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="collections">
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-pi-muted mb-4" />
                <h3 className="text-xl font-medium mb-2">Collection Management Coming Soon</h3>
                <p className="text-pi-muted max-w-md mx-auto">
                  This feature is currently in development. Check back soon for the ability to manage your NFT collections.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics">
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-pi-muted mb-4" />
                <h3 className="text-xl font-medium mb-2">Analytics Coming Soon</h3>
                <p className="text-pi-muted max-w-md mx-auto">
                  This feature is currently in development. Check back soon for detailed NFT analytics.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* NFT Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-dark-secondary border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit NFT' : 'Create New NFT'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update the details of your existing NFT' 
                : 'Fill in the details to create a new NFT'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={currentNFT.title || ''}
                onChange={(e) => setCurrentNFT({...currentNFT, title: e.target.value})}
                placeholder="Enter NFT title"
                className="bg-dark border-gray-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={currentNFT.description || ''}
                onChange={(e) => setCurrentNFT({...currentNFT, description: e.target.value})}
                placeholder="Enter a description for your NFT"
                className="bg-dark border-gray-700 min-h-24"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (ETH)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentNFT.price || ''}
                  onChange={(e) => setCurrentNFT({...currentNFT, price: parseFloat(e.target.value)})}
                  placeholder="0.00"
                  className="bg-dark border-gray-700"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="collection">Collection</Label>
                <Input
                  id="collection"
                  value={currentNFT.collection || ''}
                  onChange={(e) => setCurrentNFT({...currentNFT, collection: e.target.value})}
                  placeholder="Collection name"
                  className="bg-dark border-gray-700"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="imageUrl"
                  value={currentNFT.imageUrl || ''}
                  onChange={(e) => setCurrentNFT({...currentNFT, imageUrl: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                  className="bg-dark border-gray-700 flex-1"
                />
                <Button type="button" variant="outline" className="flex-shrink-0">
                  <Image size={16} className="mr-2" /> Browse
                </Button>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? 'Update NFT' : 'Create NFT'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNFT;
