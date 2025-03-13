
import React, { useState, useEffect } from 'react';
import { Trash2, Image } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useNFT, NFTCollection } from '@/hooks/useNFT';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface CollectionFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentCollection: Partial<NFTCollection>;
  setCurrentCollection: (collection: Partial<NFTCollection>) => void;
  onSuccess: () => void;
  isNFTDialogOpen: boolean;
  refreshData: () => Promise<void>;
}

export const CollectionFormDialog: React.FC<CollectionFormDialogProps> = ({
  isOpen,
  setIsOpen,
  currentCollection,
  setCurrentCollection,
  onSuccess,
  isNFTDialogOpen,
  refreshData
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { createCollection } = useNFT();

  // Reset the form when opening
  useEffect(() => {
    if (isOpen) {
      // Only reset if there's no current data
      if (!currentCollection.name) {
        setCurrentCollection({});
        setImageFile(null);
        setImagePreview(null);
      } else if (currentCollection.image_url) {
        setImagePreview(currentCollection.image_url);
      }
    }
  }, [isOpen, currentCollection, setCurrentCollection]);

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `collection-images/${fileName}`;
      
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
      
      await refreshData();
      
      if (isNFTDialogOpen === false) {
        onSuccess();
      } else {
        setIsOpen(false);
      }
      
      setCurrentCollection({});
      
      toast({
        title: 'Collection Created',
        description: 'Your collection has been created successfully',
      });
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open && isNFTDialogOpen === false) {
        setTimeout(() => onSuccess(), 100);
      }
    }}>
      <DialogContent className="bg-dark-secondary border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new NFT collection
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              onClick={() => {
                setIsOpen(false);
                if (isNFTDialogOpen === false) {
                  setTimeout(() => onSuccess(), 100);
                }
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
  );
};
