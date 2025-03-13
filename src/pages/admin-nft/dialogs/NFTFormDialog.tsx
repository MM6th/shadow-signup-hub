
import React, { useState } from 'react';
import { Plus, Trash2, Image } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useNFT, NFT, NFTCollection } from '@/hooks/useNFT';
import { supabase } from '@/integrations/supabase/client';
import { useUserSession } from '@/hooks/useUserSession';
import { v4 as uuidv4 } from 'uuid';

const BLOCKCHAIN_OPTIONS = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'solana', label: 'Solana' },
];

interface NFTFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isEditing: boolean;
  currentNFT: Partial<NFT>;
  collections: NFTCollection[];
  onCreateCollection: () => void;
  onClose: () => void;
  refreshData: () => Promise<void>;
}

export const NFTFormDialog: React.FC<NFTFormDialogProps> = ({
  isOpen,
  setIsOpen,
  isEditing,
  currentNFT: initialNFT,
  collections,
  onCreateCollection,
  onClose,
  refreshData
}) => {
  const [currentNFT, setCurrentNFT] = useState<Partial<NFT>>(initialNFT);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialNFT.imageurl || null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUserSession();
  const { createNFT } = useNFT();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile && !currentNFT.imageurl) {
      toast({
        title: 'Image Required',
        description: 'Please upload an image for your NFT',
        variant: 'destructive',
      });
      return;
    }
    
    if (!currentNFT.title || !currentNFT.description || !currentNFT.price) {
      toast({
        title: 'Missing Information',
        description: 'Please fill out all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    if (!currentNFT.collection && collections.length > 0) {
      toast({
        title: 'Collection Required',
        description: 'Please select a collection for your NFT',
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
        title: currentNFT.title!,
        description: currentNFT.description!,
        price: currentNFT.price!,
        imageurl: imageUrl!,
        collection: currentNFT.collection || 'Uncategorized',
        blockchain: currentNFT.blockchain || 'ethereum'
      });
      
      await refreshData();
      
      setIsOpen(false);
      onClose();
      
      toast({
        title: 'NFT Created Successfully',
        description: 'Your NFT has been added to your collection',
      });
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-dark-secondary border-gray-700 text-white max-w-2xl">
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
            <div className="flex justify-between items-center">
              <Label htmlFor="collection">Collection</Label>
              <Button 
                type="button"
                variant="link" 
                size="sm" 
                className="text-pi-focus h-6 p-0"
                onClick={onCreateCollection}
              >
                <Plus size={14} className="mr-1" /> Create New Collection
              </Button>
            </div>
            <select
              id="collection"
              value={currentNFT.collection || ''}
              onChange={(e) => setCurrentNFT({...currentNFT, collection: e.target.value})}
              className="flex h-10 w-full rounded-md border border-input bg-dark px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a collection</option>
              {collections.length === 0 && (
                <option value="Uncategorized">Uncategorized</option>
              )}
              {collections.map(collection => (
                <option key={collection.id} value={collection.name}>{collection.name}</option>
              ))}
            </select>
            {collections.length === 0 && (
              <p className="text-xs text-amber-400 mt-1">
                No collections found. Create a collection or your NFT will be marked as "Uncategorized".
              </p>
            )}
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
              onClick={() => {
                setIsOpen(false);
                onClose();
              }}
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
  );
};
