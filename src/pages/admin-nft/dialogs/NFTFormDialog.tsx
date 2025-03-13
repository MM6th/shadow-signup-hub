
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NFT, NFTCollection } from '@/hooks/useNFT';
import { useUserSession } from '@/hooks/useUserSession';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { uploadImage } from '../utils/imageUtils';
import { Info, Plus, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const BLOCKCHAIN_OPTIONS = [
  { value: 'ethereum', label: 'Ethereum', symbol: 'ETH' },
  { value: 'polygon', label: 'Polygon', symbol: 'MATIC' },
  { value: 'solana', label: 'Solana', symbol: 'SOL' },
  { value: 'binance', label: 'Binance Smart Chain', symbol: 'BNB' },
];

const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  price: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Price must be a positive number',
  }),
  collection: z.string().min(1, { message: 'Collection is required' }),
  blockchain: z.string().min(1, { message: 'Blockchain is required' }),
  currency: z.string().min(1, { message: 'Currency is required' }),
});

interface NFTFormDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
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
  currentNFT,
  collections,
  onCreateCollection,
  onClose,
  refreshData,
}) => {
  const { user } = useUserSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Changed from previous implementation - now we'll store all available currencies
  // based on the selected blockchain
  const [availableCurrencies, setAvailableCurrencies] = useState<{value: string, label: string}[]>([
    { value: 'eth', label: 'ETH' }
  ]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      collection: '',
      blockchain: 'ethereum',
      currency: 'eth',
    },
  });

  // Update available currencies when blockchain changes
  useEffect(() => {
    const blockchain = form.watch('blockchain');
    const selectedBlockchain = BLOCKCHAIN_OPTIONS.find(option => option.value === blockchain);
    
    if (selectedBlockchain) {
      const currencySymbol = selectedBlockchain.symbol.toLowerCase();
      form.setValue('currency', currencySymbol);
      setAvailableCurrencies([{ value: currencySymbol, label: selectedBlockchain.symbol }]);
    }
  }, [form.watch('blockchain')]);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && currentNFT) {
        form.reset({
          title: currentNFT.title || '',
          description: currentNFT.description || '',
          price: currentNFT.price ? String(currentNFT.price) : '',
          collection: currentNFT.collection || '',
          blockchain: currentNFT.blockchain || 'ethereum',
          currency: currentNFT.currency || 'eth',
        });
        
        if (currentNFT.imageurl) {
          setImagePreview(currentNFT.imageurl);
        } else {
          setImagePreview(null);
        }
      } else {
        form.reset({
          title: '',
          description: '',
          price: '',
          collection: currentNFT.collection || '',
          blockchain: 'ethereum',
          currency: 'eth',
        });
        
        setImagePreview(null);
      }
      setImageFile(null);
    }
  }, [isOpen, isEditing, currentNFT, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteNFT = async () => {
    if (!user || !currentNFT.id) {
      toast({
        title: 'Error',
        description: 'Unable to delete NFT. Missing user or NFT ID.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('nfts')
        .delete()
        .eq('id', currentNFT.id)
        .eq('owner_id', user.id);

      if (error) throw error;

      toast({
        title: 'NFT Deleted',
        description: 'Your NFT has been successfully deleted',
      });
      
      setDeleteDialogOpen(false);
      setIsOpen(false);
      
      // Add a delay before refreshing data to ensure DB consistency
      setTimeout(() => {
        refreshData();
      }, 1000);
    } catch (error) {
      console.error('Error deleting NFT:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to create or edit NFTs',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    let imageUrl = currentNFT.imageurl;

    try {
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      if (!imageUrl) {
        toast({
          title: 'Image required',
          description: 'Please upload an image for your NFT',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const nftData = {
        title: values.title,
        description: values.description,
        price: parseFloat(values.price),
        imageurl: imageUrl,
        collection: values.collection,
        blockchain: values.blockchain,
        currency: values.currency
      };

      if (isEditing && currentNFT.id) {
        const { data, error } = await supabase
          .from('nfts')
          .update({
            ...nftData,
            owner_id: user.id,
          })
          .eq('id', currentNFT.id)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'NFT Updated',
          description: 'Your NFT has been updated successfully',
        });
      } else {
        const { data, error } = await supabase
          .from('nfts')
          .insert({
            ...nftData,
            owner_id: user.id,
            status: 'draft',
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'NFT Created',
          description: 'Your NFT has been created successfully',
        });
      }

      // Reset form, close dialog, and refresh data
      setIsOpen(false);
      
      // Important: Wait a moment to ensure Supabase has processed the change
      // before refreshing the data
      setTimeout(() => {
        refreshData();
      }, 1000);
      
    } catch (error) {
      console.error('Error saving NFT:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] bg-dark border border-pi-border">
          <DialogHeader>
            <DialogTitle className="text-gradient font-elixia text-2xl">
              {isEditing ? 'Edit NFT' : 'Create New NFT'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter NFT title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe your NFT" className="min-h-[120px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.000001" 
                              min="0.000001" 
                              placeholder="0.00" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                          <FormDescription className="text-xs">
                            You can enter values as small as 0.000001
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableCurrencies.map((currency) => (
                                <SelectItem key={currency.value} value={currency.value}>
                                  {currency.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="blockchain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blockchain</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            const selectedBlockchain = BLOCKCHAIN_OPTIONS.find(option => option.value === value);
                            if (selectedBlockchain) {
                              form.setValue('currency', selectedBlockchain.symbol.toLowerCase());
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select blockchain" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BLOCKCHAIN_OPTIONS.map((blockchain) => (
                              <SelectItem key={blockchain.value} value={blockchain.value}>
                                {blockchain.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="collection"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Collection</FormLabel>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onCreateCollection}
                            className="text-xs flex items-center px-2 py-1 h-auto"
                          >
                            <Plus size={12} className="mr-1" />
                            Create New
                          </Button>
                        </div>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a collection" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {collections.map((collection) => (
                              <SelectItem key={collection.name} value={collection.name}>
                                {collection.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>NFT Image</FormLabel>
                    <div className="mt-2">
                      {imagePreview ? (
                        <div className="relative rounded-lg overflow-hidden w-full h-40">
                          <img
                            src={imagePreview}
                            alt="NFT Preview"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute bottom-2 right-2"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                          >
                            Change
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-500 rounded-lg h-40 cursor-pointer hover:border-pi-focus">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <span className="text-sm text-pi-muted">Click to upload</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-pi-muted mt-1">
                      Upload a high-quality image for your NFT
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <div className="flex items-center space-x-2 ml-auto">
                  {isEditing && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={() => setDeleteDialogOpen(true)}
                      className="mr-auto"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete NFT
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? 'Save Changes' : 'Create NFT'}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this NFT?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the NFT and remove any associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteNFT}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
