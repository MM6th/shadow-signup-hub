import React, { useState, useEffect } from 'react';
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
import { uploadFile } from '../utils/imageUtils';
import { Info, Plus, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { NFTDeleteDialog } from './NFTDeleteDialog';
import { NFTMediaPreview } from '../components/NFTMediaPreview';
import { BLOCKCHAIN_OPTIONS, CONTENT_TYPE_OPTIONS } from '../constants/nftFormConstants';
import { nftFormSchema, NFTFormData } from '../schemas/nftFormSchema';

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
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contentType, setContentType] = useState<string>('image');
  
  // Changed from previous implementation - now we'll store all available currencies
  // based on the selected blockchain
  const [availableCurrencies, setAvailableCurrencies] = useState<{value: string, label: string}[]>([
    { value: 'eth', label: 'ETH' }
  ]);

  const form = useForm<NFTFormData>({
    resolver: zodResolver(nftFormSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      collection: '',
      blockchain: 'ethereum',
      currency: 'eth',
      content_type: 'image',
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
          content_type: currentNFT.content_type || 'image',
        });
        
        setContentType(currentNFT.content_type || 'image');
        
        if (currentNFT.imageurl) {
          setMediaPreview(currentNFT.imageurl);
        } else if (currentNFT.file_url) {
          setMediaPreview(currentNFT.file_url);
        } else {
          setMediaPreview(null);
        }
      } else {
        form.reset({
          title: '',
          description: '',
          price: '',
          collection: currentNFT.collection || '',
          blockchain: 'ethereum',
          currency: 'eth',
          content_type: 'image',
        });
        
        setContentType('image');
        setMediaPreview(null);
      }
      setMediaFile(null);
    }
  }, [isOpen, isEditing, currentNFT, form]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      
      const contentTypeVal = form.getValues('content_type') || 'image';
      
      // For image and PDF, show preview
      if (contentTypeVal === 'image' || (contentTypeVal === 'book' && file.type === 'application/pdf')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // For video and audio, just show the filename
        setMediaPreview(URL.createObjectURL(file));
      }
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
      // First, check if the NFT is owned by the current user
      const { data: nftData, error: nftError } = await supabase
        .from('nfts')
        .select('*')
        .eq('id', currentNFT.id)
        .single();
      
      if (nftError) throw nftError;
      
      if (nftData.owner_id !== user.id) {
        throw new Error('You can only delete NFTs that you own');
      }

      // Delete any transactions related to this NFT (if cascade delete is not set up)
      const { error: txError } = await supabase
        .from('nft_transactions')
        .delete()
        .eq('nft_id', currentNFT.id);
      
      if (txError) console.error('Error deleting related transactions:', txError);
      
      // Delete associated files from storage
      const nft = nftData as unknown as NFT;
      
      // Delete image file if it exists
      if (nft.imageurl) {
        try {
          const imagePathMatch = nft.imageurl.match(/\/([^\/]+)\/([^\/]+)$/);
          if (imagePathMatch && imagePathMatch.length === 3) {
            const bucketName = imagePathMatch[1];
            const fileName = imagePathMatch[2];
            
            console.log(`Deleting image from storage: bucket=${bucketName}, file=${fileName}`);
            
            await supabase.storage
              .from(bucketName)
              .remove([fileName]);
          }
        } catch (error) {
          console.error('Error deleting image from storage:', error);
        }
      }
      
      // Delete additional file if it exists (for non-image content types)
      if (nft.file_url && nft.content_type !== 'image') {
        try {
          const filePathMatch = nft.file_url.match(/\/([^\/]+)\/([^\/]+)$/);
          if (filePathMatch && filePathMatch.length === 3) {
            const bucketName = filePathMatch[1];
            const fileName = filePathMatch[2];
            
            console.log(`Deleting file from storage: bucket=${bucketName}, file=${fileName}`);
            
            await supabase.storage
              .from(bucketName)
              .remove([fileName]);
          }
        } catch (error) {
          console.error('Error deleting file from storage:', error);
        }
      }
      
      // Finally delete the NFT
      const { error } = await supabase
        .from('nfts')
        .delete()
        .eq('id', currentNFT.id);

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

  const onSubmit = async (values: NFTFormData) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to create or edit NFTs',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    let fileUrl: string | null = null;
    let imageUrl: string | null = currentNFT.imageurl || null;
    let fileType: string | null = null;

    try {
      if (mediaFile) {
        const uploadResult = await uploadFile(mediaFile, values.content_type);
        
        if (values.content_type === 'image') {
          imageUrl = uploadResult.url;
        } else {
          fileUrl = uploadResult.url;
          fileType = uploadResult.fileType;
        }
      }

      if (values.content_type === 'image' && !imageUrl) {
        toast({
          title: 'Image required',
          description: 'Please upload an image for your NFT',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (values.content_type !== 'image' && !fileUrl) {
        toast({
          title: 'File required',
          description: `Please upload a ${values.content_type} file for your NFT`,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const nftData = {
        title: values.title,
        description: values.description,
        price: parseFloat(values.price),
        imageurl: imageUrl || '', // Keep for backward compatibility
        collection: values.collection,
        blockchain: values.blockchain,
        currency: values.currency,
        content_type: values.content_type,
        file_url: fileUrl,
        file_type: fileType,
      };

      if (isEditing && currentNFT.id) {
        const { error } = await supabase
          .from('nfts')
          .update({
            ...nftData,
            owner_id: user.id,
          })
          .eq('id', currentNFT.id);

        if (error) throw error;

        toast({
          title: 'NFT Updated',
          description: 'Your NFT has been updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('nfts')
          .insert({
            ...nftData,
            owner_id: user.id,
            status: 'draft',
          });

        if (error) throw error;

        toast({
          title: 'NFT Created',
          description: 'Your NFT has been created successfully',
        });
      }

      // Reset form and close dialog
      form.reset();
      setIsOpen(false);
      
      // Ensure we perform a full refresh immediately after successful creation/update
      console.log("NFT saved successfully, triggering data refresh");
      await refreshData();
      
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
                    name="content_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Type</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            setContentType(value);
                            setMediaFile(null);
                            setMediaPreview(null);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select content type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONTENT_TYPE_OPTIONS.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center">
                                  {type.icon}
                                  {type.label}
                                </div>
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
                    <FormLabel>NFT Media</FormLabel>
                    <NFTMediaPreview 
                      contentType={form.watch('content_type')}
                      mediaPreview={mediaPreview}
                      mediaFile={mediaFile}
                      onRemoveMedia={() => {
                        setMediaFile(null);
                        setMediaPreview(null);
                      }}
                      onMediaChange={handleMediaChange}
                    />
                    <p className="text-xs text-pi-muted mt-1">
                      {form.watch('content_type') === 'image' 
                        ? 'Upload a high-quality image for your NFT'
                        : form.watch('content_type') === 'video'
                        ? 'Upload a video file for your NFT (MP4, WebM recommended)'
                        : form.watch('content_type') === 'book'
                        ? 'Upload a document for your NFT (PDF, EPUB recommended)'
                        : 'Upload an audio file for your NFT (MP3, WAV recommended)'}
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

      <NFTDeleteDialog
        isOpen={deleteDialogOpen}
        setIsOpen={setDeleteDialogOpen}
        onDelete={handleDeleteNFT}
        isLoading={isLoading}
      />
    </>
  );
};
