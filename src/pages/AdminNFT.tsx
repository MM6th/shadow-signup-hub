import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Plus, Edit, Trash2, Image, Package, DollarSign, Tag, ChevronUp, ChevronDown, Wallet, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserSession } from '@/hooks/useUserSession';
import { useNFT, NFT, NFTCollection } from '@/hooks/useNFT';
import { useWallet } from '@/hooks/useWallet';
import { v4 as uuidv4 } from 'uuid';

const ADMIN_EMAILS = ['cmooregee@gmail.com'];

const BLOCKCHAIN_OPTIONS = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'solana', label: 'Solana' },
];

const AdminNFT: React.FC = () => {
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
    createNFT,
    createCollection,
    simulateMintNFT,
    listNFTForSale
  } = useNFT();
  
  const [isNFTDialogOpen, setIsNFTDialogOpen] = useState(false);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [currentNFT, setCurrentNFT] = useState<Partial<NFT>>({});
  const [currentCollection, setCurrentCollection] = useState<Partial<NFTCollection>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>('marketplace');
  const [isLoading, setIsLoading] = useState(false);
  const [salesData, setSalesData] = useState<{date: string; sales: number}[]>([]);

  useEffect(() => {
    if (user) {
      fetchNFTs();
      fetchCollections();
      
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setImageFile(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `nft-images/${fileName}`;
      
      const { error } = await supabase.storage
        .from('products')
        .upload(filePath, file);
        
      if (error) {
        throw error;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);
        
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleNFTSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile && !currentNFT.imageurl) {
      toast({
        title: 'Image Required',
        description: 'Please upload an image for your NFT',
        variant: 'destructive',
      });
      return;
    }
    
    if (!currentNFT.title || !currentNFT.description || !currentNFT.price || !currentNFT.collection) {
      toast({
        title: 'Missing Information',
        description: 'Please fill out all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      let imageUrl = currentNFT.imageurl;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) return;
      }
      
      await createNFT({
        title: currentNFT.title,
        description: currentNFT.description,
        price: currentNFT.price,
        imageurl: imageUrl!,
        collection: currentNFT.collection,
        blockchain: currentNFT.blockchain || 'ethereum'
      });
      
      fetchNFTs();
      
      setIsNFTDialogOpen(false);
      setCurrentNFT({});
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error saving NFT:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while saving the NFT',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentCollection.name || !currentCollection.description) {
      toast({
        title: 'Missing Information',
        description: 'Please fill out all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      let imageUrl = currentCollection.image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      
      await createCollection({
        name: currentCollection.name,
        description: currentCollection.description,
        image_url: imageUrl
      });
      
      fetchCollections();
      
      setIsCollectionDialogOpen(false);
      setCurrentCollection({});
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error saving collection:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while saving the collection',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    fetchNFTs();
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
    fetchNFTs();
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
            
            <TabsContent value="marketplace" className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Your NFTs</h2>
                <Button onClick={() => {
                  setIsEditing(false);
                  setCurrentNFT({});
                  setImageFile(null);
                  setImagePreview(null);
                  setIsNFTDialogOpen(true);
                }}>
                  <Plus size={16} className="mr-2" /> Create NFT
                </Button>
              </div>
              
              {nftLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-pi-muted">Loading NFTs...</p>
                </div>
              ) : nfts.length === 0 ? (
                <div className="text-center py-12 glass-card rounded-lg">
                  <Package size={48} className="mx-auto text-pi-muted mb-4" />
                  <h3 className="text-xl font-medium mb-2">No NFTs Found</h3>
                  <p className="text-pi-muted max-w-md mx-auto mb-4">
                    You haven't created any NFTs yet. Create your first NFT by clicking the button above.
                  </p>
                  <Button onClick={() => {
                    setIsEditing(false);
                    setCurrentNFT({});
                    setIsNFTDialogOpen(true);
                  }}>
                    <Plus size={16} className="mr-2" /> Create Your First NFT
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nfts.map(nft => (
                    <div key={nft.id} className="glass-card rounded-lg overflow-hidden border border-white/10">
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
                            {nft.price} ETH
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
                        
                        <div className="flex gap-2 justify-end">
                          {nft.status === 'draft' && (
                            <Button variant="outline" size="sm" onClick={() => handleMintNFT(nft.id)}>
                              Mint NFT
                            </Button>
                          )}
                          {nft.status === 'minted' && (
                            <Button variant="outline" size="sm" onClick={() => handleListNFT(nft.id, nft.price)}>
                              List for Sale
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => {
                            setIsEditing(true);
                            setCurrentNFT(nft);
                            setImagePreview(nft.imageurl);
                            setIsNFTDialogOpen(true);
                          }}>
                            <Edit size={14} className="mr-1" /> Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="collections" className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Your Collections</h2>
                <Button onClick={() => {
                  setCurrentCollection({});
                  setImageFile(null);
                  setImagePreview(null);
                  setIsCollectionDialogOpen(true);
                }}>
                  <Plus size={16} className="mr-2" /> Create Collection
                </Button>
              </div>
              
              {nftLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-pi-muted">Loading collections...</p>
                </div>
              ) : collections.length === 0 ? (
                <div className="text-center py-12 glass-card rounded-lg">
                  <Package size={48} className="mx-auto text-pi-muted mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Collections Found</h3>
                  <p className="text-pi-muted max-w-md mx-auto mb-4">
                    You haven't created any collections yet. Create your first collection by clicking the button above.
                  </p>
                  <Button onClick={() => {
                    setCurrentCollection({});
                    setIsCollectionDialogOpen(true);
                  }}>
                    <Plus size={16} className="mr-2" /> Create Your First Collection
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {collections.map(collection => (
                    <div key={collection.id} className="glass-card rounded-lg overflow-hidden border border-white/10">
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
                          <Button variant="outline" size="sm" onClick={() => {
                            const collectionNFTs = nfts.filter(nft => nft.collection === collection.name);
                            toast({
                              title: `${collection.name}`,
                              description: `Contains ${collectionNFTs.length} NFTs`,
                            });
                          }}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Total NFTs</h3>
                  <div className="flex items-center">
                    <span className="text-3xl font-bold">{nfts.length}</span>
                    <span className="ml-2 text-xs px-2 py-1 rounded bg-green-900/30 text-green-400">
                      <ChevronUp size={14} className="inline mr-1" />
                      {Math.floor(Math.random() * 20) + 5}%
                    </span>
                  </div>
                  <p className="text-xs text-pi-muted mt-2">Compared to last month</p>
                </div>
                
                <div className="glass-card p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Listed NFTs</h3>
                  <div className="flex items-center">
                    <span className="text-3xl font-bold">
                      {nfts.filter(nft => nft.status === 'listed').length}
                    </span>
                    <span className="ml-2 text-xs px-2 py-1 rounded bg-green-900/30 text-green-400">
                      <ChevronUp size={14} className="inline mr-1" />
                      {Math.floor(Math.random() * 10) + 10}%
                    </span>
                  </div>
                  <p className="text-xs text-pi-muted mt-2">Compared to last month</p>
                </div>
                
                <div className="glass-card p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Total Revenue</h3>
                  <div className="flex items-center">
                    <span className="text-3xl font-bold">{(Math.random() * 10).toFixed(2)} ETH</span>
                    <span className="ml-2 text-xs px-2 py-1 rounded bg-red-900/30 text-red-400">
                      <ChevronDown size={14} className="inline mr-1" />
                      {Math.floor(Math.random() * 10)}%
                    </span>
                  </div>
                  <p className="text-xs text-pi-muted mt-2">Compared to last month</p>
                </div>
              </div>
              
              <div className="glass-card p-6 rounded-lg">
                <h3 className="text-xl font-medium mb-4">Sales Overview</h3>
                <div className="h-64 w-full">
                  <div className="flex items-end h-full w-full space-x-1">
                    {salesData.map((data, i) => (
                      <div key={i} className="relative group flex-1 h-full flex flex-col justify-end">
                        <div 
                          className="bg-gradient-to-t from-pi-focus to-purple-500 rounded-t w-full"
                          style={{ height: `${data.sales * 10}%` }}
                        ></div>
                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 w-full text-center">
                          <div className="bg-black/70 text-white text-xs py-1 px-2 rounded">
                            {data.sales} sales on {data.date}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-pi-muted">
                  <span>{salesData[0]?.date}</span>
                  <span>{salesData[salesData.length - 1]?.date}</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isNFTDialogOpen} onOpenChange={setIsNFTDialogOpen}>
        <DialogContent className="bg-dark-secondary border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit NFT' : 'Create New NFT'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update the details of your existing NFT' 
                : 'Fill in the details to create a new NFT'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleNFTSubmit} className="space-y-4">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="blockchain">Blockchain</Label>
                <select
                  id="blockchain"
                  value={currentNFT.blockchain || 'ethereum'}
                  onChange={(e) => setCurrentNFT({...currentNFT, blockchain: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-dark px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {BLOCKCHAIN_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="collection">Collection</Label>
              <select
                id="collection"
                value={currentNFT.collection || ''}
                onChange={(e) => setCurrentNFT({...currentNFT, collection: e.target.value})}
                className="flex h-10 w-full rounded-md border border-input bg-dark px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a collection</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.name}>{collection.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageUrl">NFT Image</Label>
              <div className="mt-1">
                {imagePreview ? (
                  <div className="relative w-full h-48 rounded-md overflow-hidden mb-2">
                    <img 
                      src={imagePreview} 
                      alt="NFT preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-500 rounded-md cursor-pointer hover:border-pi-focus transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Image className="mb-2 text-pi-muted" size={24} />
                        <p className="text-sm text-pi-muted">
                          Click to upload NFT image
                        </p>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsNFTDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="mr-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    </span>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update NFT' : 'Create NFT'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
        <DialogContent className="bg-dark-secondary border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new NFT collection
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCollectionSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Collection Name</Label>
              <Input
                id="name"
                value={currentCollection.name || ''}
                onChange={(e) => setCurrentCollection({...currentCollection, name: e.target.value})}
                placeholder="Enter collection name"
                className="bg-dark border-gray-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="collectionDescription">Description</Label>
              <Textarea
                id="collectionDescription"
                value={currentCollection.description || ''}
                onChange={(e) => setCurrentCollection({...currentCollection, description: e.target.value})}
                placeholder="Enter a description for your collection"
                className="bg-dark border-gray-700 min-h-24"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="collectionImage">Collection Cover Image (Optional)</Label>
              <div className="mt-1">
                {imagePreview ? (
                  <div className="relative w-full h-48 rounded-md overflow-hidden mb-2">
                    <img 
                      src={imagePreview} 
                      alt="Collection preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="collection-image-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-500 rounded-md cursor-pointer hover:border-pi-focus transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Image className="mb-2 text-pi-muted" size={24} />
                        <p className="text-sm text-pi-muted">
                          Click to upload collection image
                        </p>
                      </div>
                      <input
                        id="collection-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCollectionDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="mr-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    </span>
                    Creating...
                  </>
                ) : (
                  'Create Collection'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNFT;
