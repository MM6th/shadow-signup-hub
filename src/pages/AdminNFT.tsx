
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Button from '@/components/Button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ImagePlus, Image, Plus, ArrowLeft, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Sample NFT collection data
const SAMPLE_NFTS = [
  {
    id: '1',
    title: 'Cosmic Astrology #01',
    description: 'Limited edition astrology-themed NFT featuring cosmic elements and zodiac symbols.',
    price: 0.5,
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=1740',
    status: 'available',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Spiritual Guidance #03',
    description: 'A spiritual journey represented through abstract digital art. Part of the Guidance collection.',
    price: 0.8,
    image: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&q=80&w=1742',
    status: 'sold',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    title: 'Psychic Vision #07',
    description: 'Representing the third eye and psychic awareness through vibrant digital artwork.',
    price: 1.2,
    image: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&q=80&w=1740',
    status: 'available',
    created_at: new Date(Date.now() - 172800000).toISOString(),
  }
];

const AdminNFT: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nfts, setNfts] = useState(SAMPLE_NFTS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAddingNFT, setIsAddingNFT] = useState(false);
  const [newNFT, setNewNFT] = useState({
    title: '',
    description: '',
    price: 0,
    image: ''
  });
  
  // Check if user is admin (This would be replaced with actual admin check logic)
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      // This is a placeholder for real admin checking logic
      // In a real app, you would check against a user_roles table or similar
      try {
        // Simulate admin check - in real app, this would query a roles table
        // For demo purposes, we'll just set the creator of profile as admin
        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);
  
  // If not admin, redirect
  useEffect(() => {
    if (user && isAdmin === false) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [user, isAdmin, navigate, toast]);
  
  if (!user) {
    navigate('/');
    return null;
  }
  
  const handleAddNFT = () => {
    if (!newNFT.title || !newNFT.description || newNFT.price <= 0 || !newNFT.image) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields and ensure price is greater than 0.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would save to the database
    const id = (nfts.length + 1).toString();
    setNfts([
      ...nfts,
      {
        ...newNFT,
        id,
        status: 'available',
        created_at: new Date().toISOString()
      }
    ]);
    
    setNewNFT({
      title: '',
      description: '',
      price: 0,
      image: ''
    });
    
    setIsAddingNFT(false);
    
    toast({
      title: "NFT Added",
      description: "The NFT has been added to the collection.",
    });
  };
  
  const handleDeleteNFT = (id: string) => {
    setNfts(nfts.filter(nft => nft.id !== id));
    toast({
      title: "NFT Removed",
      description: "The NFT has been removed from the collection.",
    });
  };
  
  return (
    <div className="min-h-screen bg-dark bg-dark-gradient text-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-elixia text-gradient">NFT Collection Management</h1>
          
          <Button 
            variant="primary" 
            onClick={() => setIsAddingNFT(!isAddingNFT)}
            className="flex items-center gap-2"
          >
            {isAddingNFT ? 'Cancel' : <><Plus size={16} /> Create NFT</>}
          </Button>
        </div>
        
        {isAddingNFT && (
          <Card className="glass-card mb-8">
            <CardHeader>
              <h2 className="text-xl font-medium">Create New NFT</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nft-title">Title</Label>
                    <Input 
                      id="nft-title" 
                      value={newNFT.title}
                      onChange={(e) => setNewNFT({...newNFT, title: e.target.value})}
                      className="bg-dark-secondary border-white/10"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="nft-price">Price (ETH)</Label>
                    <Input 
                      id="nft-price" 
                      type="number"
                      step="0.01"
                      min="0"
                      value={newNFT.price}
                      onChange={(e) => setNewNFT({...newNFT, price: parseFloat(e.target.value)})}
                      className="bg-dark-secondary border-white/10"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="nft-image">Image URL</Label>
                    <Input 
                      id="nft-image" 
                      value={newNFT.image}
                      onChange={(e) => setNewNFT({...newNFT, image: e.target.value})}
                      className="bg-dark-secondary border-white/10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="nft-description">Description</Label>
                  <Textarea 
                    id="nft-description" 
                    rows={6}
                    value={newNFT.description}
                    onChange={(e) => setNewNFT({...newNFT, description: e.target.value})}
                    className="bg-dark-secondary border-white/10 h-full"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                variant="primary" 
                onClick={handleAddNFT}
              >
                Add NFT to Collection
              </Button>
            </CardFooter>
          </Card>
        )}
        
        <Card className="glass-card">
          <CardHeader>
            <h2 className="text-xl font-medium">NFT Collection</h2>
            <p className="text-pi-muted">Manage your NFT offerings for the marketplace</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price (ETH)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nfts.map((nft) => (
                    <TableRow key={nft.id}>
                      <TableCell>
                        <div className="h-16 w-16 rounded overflow-hidden bg-dark-secondary flex items-center justify-center">
                          {nft.image ? (
                            <img src={nft.image} alt={nft.title} className="h-full w-full object-cover" />
                          ) : (
                            <Image className="text-pi-muted" size={24} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{nft.title}</TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate">{nft.description}</p>
                      </TableCell>
                      <TableCell>{nft.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          nft.status === 'available' 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {nft.status === 'available' ? 'Available' : 'Sold'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" className="inline-flex items-center">
                          <Edit size={14} className="mr-1" /> Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="inline-flex items-center text-red-500 hover:text-red-400"
                          onClick={() => handleDeleteNFT(nft.id)}
                        >
                          <Trash2 size={14} className="mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNFT;
