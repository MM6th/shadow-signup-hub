
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Minus, ShoppingBag, Upload, X, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Supported cryptocurrencies
const CRYPTO_OPTIONS = [
  { value: 'bitcoin', label: 'Bitcoin (BTC)' },
  { value: 'ethereum', label: 'Ethereum (ETH)' },
  { value: 'solana', label: 'Solana (SOL)' },
  { value: 'cardano', label: 'Cardano (ADA)' },
  { value: 'polkadot', label: 'Polkadot (DOT)' },
];

// Product categories
const CATEGORY_OPTIONS = [
  { value: 'reading', label: 'Personal Readings' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'subscription', label: 'Subscriptions' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'ebook', label: 'Digital Products' },
];

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  type: z.enum(['digital', 'tangible']),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Price must be a positive number',
  }),
  category: z.string().min(1, 'Please select a category'),
  image: z.any().optional(),
});

interface WalletAddress {
  id: string;
  cryptoType: string;
  address: string;
}

interface ProductFormProps {
  initialValues?: any;
  initialWalletAddresses?: WalletAddress[];
  isEditing?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  initialValues = null, 
  initialWalletAddresses = [], 
  isEditing = false 
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>(initialWalletAddresses);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialValues?.image_url || null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialValues?.title || '',
      type: initialValues?.type || 'digital',
      description: initialValues?.description || '',
      price: initialValues?.price ? String(initialValues.price) : '',
      category: initialValues?.category || '',
    },
  });

  const addWalletAddress = () => {
    if (walletAddresses.length >= 3) {
      toast({
        title: "Maximum limit reached",
        description: "You can only add up to 3 wallet addresses",
        variant: "destructive",
      });
      return;
    }
    
    setWalletAddresses([
      ...walletAddresses, 
      { id: uuidv4(), cryptoType: '', address: '' }
    ]);
  };

  const removeWalletAddress = (id: string) => {
    setWalletAddresses(walletAddresses.filter(wallet => wallet.id !== id));
  };

  const updateWalletAddress = (id: string, field: 'cryptoType' | 'address', value: string) => {
    setWalletAddresses(walletAddresses.map(wallet => 
      wallet.id === id ? { ...wallet, [field]: value } : wallet
    ));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Preview the image
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to create a product",
        variant: "destructive",
      });
      return;
    }
    
    // Validate wallet addresses
    if (walletAddresses.length === 0) {
      toast({
        title: "Wallet address required",
        description: "Please add at least one wallet address",
        variant: "destructive",
      });
      return;
    }
    
    for (const wallet of walletAddresses) {
      if (!wallet.cryptoType || !wallet.address) {
        toast({
          title: "Incomplete wallet information",
          description: "Please fill in all wallet address fields",
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      let imageUrl = initialValues?.image_url || null;
      
      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `product-images/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, imageFile);
          
        if (uploadError) {
          throw new Error(uploadError.message);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
      }
      
      let product;
      
      if (isEditing && initialValues) {
        // Update existing product
        const { data: updatedProduct, error: updateError } = await supabase
          .from('products')
          .update({
            title: values.title,
            type: values.type,
            description: values.description,
            price: parseFloat(values.price),
            category: values.category,
            image_url: imageUrl,
          })
          .eq('id', initialValues.id)
          .select()
          .single();
          
        if (updateError) throw new Error(updateError.message);
        product = updatedProduct;
        
        // Handle wallet addresses updates
        // First, delete all existing wallet addresses
        const { error: deleteWalletsError } = await supabase
          .from('wallet_addresses')
          .delete()
          .eq('product_id', initialValues.id);
          
        if (deleteWalletsError) throw new Error(deleteWalletsError.message);
      } else {
        // Insert new product
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            user_id: user.id,
            title: values.title,
            type: values.type,
            description: values.description,
            price: parseFloat(values.price),
            category: values.category,
            image_url: imageUrl,
          })
          .select()
          .single();
          
        if (productError) throw new Error(productError.message);
        product = newProduct;
      }
      
      // Insert wallet addresses
      const walletData = walletAddresses.map(wallet => ({
        product_id: product.id,
        crypto_type: wallet.cryptoType,
        wallet_address: wallet.address,
      }));
      
      const { error: walletError } = await supabase
        .from('wallet_addresses')
        .insert(walletData);
        
      if (walletError) throw new Error(walletError.message);
      
      toast({
        title: isEditing ? "Product updated successfully" : "Product created successfully",
        description: isEditing 
          ? "Your product has been updated in the marketplace" 
          : "Your product has been added to the marketplace",
      });
      
      // Redirect to marketplace
      navigate('/marketplace');
      
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: isEditing ? "Error updating product" : "Error creating product",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-elixia text-gradient mb-6">
        {isEditing ? "Edit Product or Service" : "Create New Product or Service"}
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product/service title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-row space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="digital" id="digital" />
                      <label htmlFor="digital" className="cursor-pointer">Digital</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tangible" id="tangible" />
                      <label htmlFor="tangible" className="cursor-pointer">Tangible</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  >
                    <option value="">Select a category</option>
                    {CATEGORY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
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
                  <Textarea 
                    placeholder="Describe your product or service" 
                    className="min-h-[120px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="image"
            render={() => (
              <FormItem>
                <FormLabel>Product Image</FormLabel>
                <div className="mt-1">
                  {imagePreview ? (
                    <div className="relative w-full h-48 rounded-md overflow-hidden mb-2">
                      <img 
                        src={imagePreview} 
                        alt="Product preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-500 rounded-md cursor-pointer hover:border-pi-focus transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="mb-2 text-pi-muted" size={24} />
                          <p className="text-sm text-pi-muted">
                            Click to upload an image
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
                <FormDescription>
                  Upload a thumbnail image for your product (optional)
                </FormDescription>
              </FormItem>
            )}
          />
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Wallet Addresses</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addWalletAddress}
                disabled={walletAddresses.length >= 3}
              >
                <Plus size={16} className="mr-2" /> Add Wallet
              </Button>
            </div>
            
            <FormDescription>
              Add up to 3 wallet addresses for different cryptocurrencies
            </FormDescription>
            
            {walletAddresses.length === 0 && (
              <div className="p-4 rounded-md border border-gray-600 bg-dark-secondary text-center text-pi-muted">
                <ShoppingBag className="mx-auto mb-2" size={24} />
                <p>No wallet addresses added yet</p>
                <p className="text-sm">Click "Add Wallet" to add a payment method</p>
              </div>
            )}
            
            {walletAddresses.map((wallet, index) => (
              <div key={wallet.id} className="p-4 rounded-md border border-gray-600 bg-dark-secondary space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Wallet #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWalletAddress(wallet.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Minus size={16} className="mr-2" /> Remove
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Cryptocurrency</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={wallet.cryptoType}
                      onChange={(e) => updateWalletAddress(wallet.id, 'cryptoType', e.target.value)}
                    >
                      <option value="">Select a cryptocurrency</option>
                      {CRYPTO_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Wallet Address</label>
                    <Input
                      placeholder="Enter wallet address"
                      value={wallet.address}
                      onChange={(e) => updateWalletAddress(wallet.id, 'address', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (isEditing ? 'Updating...' : 'Creating...') 
                : (isEditing ? 'Update Product' : 'Create Product')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProductForm;
