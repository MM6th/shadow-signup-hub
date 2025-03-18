import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Minus, ShoppingBag, Upload, X, CreditCard, Music, FileAudio, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

const CRYPTO_OPTIONS = [
  { value: 'bitcoin', label: 'Bitcoin (BTC)' },
  { value: 'ethereum', label: 'Ethereum (ETH)' },
  { value: 'solana', label: 'Solana (SOL)' },
  { value: 'cardano', label: 'Cardano (ADA)' },
  { value: 'polkadot', label: 'Polkadot (DOT)' },
  { value: 'litecoin', label: 'Litecoin (LTC)' },
  { value: 'usdc', label: 'USD Coin (USDC)' },
  { value: 'bnb', label: 'Binance Coin (BNB)' }
];

const CATEGORY_OPTIONS = [
  { value: 'reading', label: 'Personal Readings' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'subscription', label: 'Subscriptions' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'ebook', label: 'Digital Products' },
  { value: 'music', label: 'Music & Audio' }
];

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  type: z.enum(['digital', 'tangible']),
  digitalType: z.enum(['conference', 'audio']).optional(),
  audioType: z.enum(['single', 'collection']).optional(),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Price must be a positive number',
  }),
  priceCurrency: z.string().default('usd'),
  category: z.string().min(1, 'Please select a category'),
  contact_phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  image: z.any().optional(),
  enablePaypal: z.boolean().default(false),
  artistName: z.string().optional(),
  publishingYear: z.string().optional(),
  lyrics: z.string().optional(),
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
  paypalClientId?: string;
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  initialValues = null, 
  initialWalletAddresses = [], 
  isEditing = false,
  paypalClientId = ''
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>(initialWalletAddresses);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialValues?.image_url || null);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [cryptoPaymentsEnabled, setCryptoPaymentsEnabled] = useState<boolean>(initialWalletAddresses.length > 0);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [audioFilePreviews, setAudioFilePreviews] = useState<{name: string, size: string, url: string}[]>([]);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const ADMIN_EMAIL = "cmooregee@gmail.com";
  const isAdminUser = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (user && !isAdminUser) {
      toast({
        title: "Access restricted",
        description: "Only administrators can create or edit products",
        variant: "destructive",
      });
      navigate('/marketplace');
    }
  }, [user, isAdminUser, navigate, toast]);

  useEffect(() => {
    const fetchCryptoPrices = async () => {
      try {
        setIsLoadingPrices(true);
        const cryptoIds = CRYPTO_OPTIONS.map(option => option.value).join(',');
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd`);
        if (!response.ok) {
          throw new Error('Failed to fetch crypto prices');
        }
        const data = await response.json();
        const prices: Record<string, number> = {};
        Object.entries(data).forEach(([cryptoId, priceData]: [string, any]) => {
          prices[cryptoId] = priceData.usd;
        });
        setCryptoPrices(prices);
      } catch (error) {
        console.error('Error fetching crypto prices:', error);
        toast({
          title: "Failed to load crypto prices",
          description: "Using estimated conversions instead",
          variant: "destructive",
        });
        setCryptoPrices({
          bitcoin: 65000,
          ethereum: 3500,
          solana: 140,
          cardano: 0.5,
          polkadot: 7,
          litecoin: 80,
          usdc: 1,
          bnb: 600
        });
      } finally {
        setIsLoadingPrices(false);
      }
    };

    fetchCryptoPrices();
  }, [toast]);

  if (!isAdminUser) {
    return null;
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialValues?.title || '',
      type: initialValues?.type || 'digital',
      digitalType: initialValues?.digital_type || '',
      audioType: initialValues?.audio_type || '',
      description: initialValues?.description || '',
      price: initialValues?.price ? String(initialValues.price) : '',
      priceCurrency: initialValues?.price_currency || 'usd',
      category: initialValues?.category || '',
      contact_phone: initialValues?.contact_phone || '',
      enablePaypal: initialValues?.enable_paypal || false,
      artistName: initialValues?.artist_name || '',
      publishingYear: initialValues?.publishing_year || '',
      lyrics: initialValues?.lyrics || '',
    },
  });

  const watchPrice = form.watch('price');
  const watchPriceCurrency = form.watch('priceCurrency');
  const watchType = form.watch('type');
  const watchDigitalType = form.watch('digitalType');
  const watchAudioType = form.watch('audioType');
  const watchCategory = form.watch('category');
  
  const isAudioProduct = watchType === 'digital' && watchDigitalType === 'audio';
  
  const convertPrice = (price: string, fromCurrency: string, toCurrency: string): string => {
    if (!price || isNaN(parseFloat(price))) return '0';
    
    const numericPrice = parseFloat(price);
    
    if (fromCurrency === toCurrency) return numericPrice.toFixed(2);
    
    if (fromCurrency === 'usd' && toCurrency !== 'usd') {
      if (!cryptoPrices[toCurrency]) return 'N/A';
      return (numericPrice / cryptoPrices[toCurrency]).toFixed(6);
    }
    
    if (fromCurrency !== 'usd' && toCurrency === 'usd') {
      if (!cryptoPrices[fromCurrency]) return 'N/A';
      return (numericPrice * cryptoPrices[fromCurrency]).toFixed(2);
    }
    
    if (fromCurrency !== 'usd' && toCurrency !== 'usd') {
      if (!cryptoPrices[fromCurrency] || !cryptoPrices[toCurrency]) return 'N/A';
      const usdValue = numericPrice * cryptoPrices[fromCurrency];
      return (usdValue / cryptoPrices[toCurrency]).toFixed(6);
    }
    
    return 'N/A';
  };

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
    
    if (walletAddresses.length === 1) {
      setCryptoPaymentsEnabled(false);
    }
  };

  const updateWalletAddress = (id: string, field: 'cryptoType' | 'address', value: string) => {
    setWalletAddresses(walletAddresses.map(wallet => 
      wallet.id === id ? { ...wallet, [field]: value } : wallet
    ));
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

  const handleAudioFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (watchAudioType === 'single' && audioFiles.length > 0) {
      setAudioFiles([files[0]]);
      
      const url = URL.createObjectURL(files[0]);
      setAudioFilePreviews([{
        name: files[0].name,
        size: (files[0].size / (1024 * 1024)).toFixed(2) + ' MB',
        url
      }]);
      return;
    }
    
    const newFiles = Array.from(files);
    setAudioFiles(prev => {
      if (watchAudioType === 'single') {
        return [newFiles[0]];
      }
      return [...prev, ...newFiles];
    });
    
    const newPreviews = newFiles.map(file => ({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      url: URL.createObjectURL(file)
    }));
    
    setAudioFilePreviews(prev => {
      if (watchAudioType === 'single') {
        return [newPreviews[0]];
      }
      return [...prev, ...newPreviews];
    });
  };

  const removeAudioFile = (index: number) => {
    URL.revokeObjectURL(audioFilePreviews[index].url);
    
    setAudioFiles(prev => prev.filter((_, i) => i !== index));
    setAudioFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return initialValues?.image_url || null;
    
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('products')
        .upload(filePath, imageFile);
        
      if (uploadError) {
        throw new Error(uploadError.message);
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);
        
      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const uploadAudioFiles = async (): Promise<{urls: string[], fileNames: string[]}> => {
    if (audioFiles.length === 0) return { urls: [], fileNames: [] };
    
    try {
      const urls: string[] = [];
      const fileNames: string[] = [];
      
      for (const audioFile of audioFiles) {
        const fileExt = audioFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `audio-files/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('audio')
          .upload(filePath, audioFile);
          
        if (uploadError) {
          throw new Error(uploadError.message);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('audio')
          .getPublicUrl(filePath);
          
        urls.push(publicUrl);
        fileNames.push(audioFile.name);
      }
      
      return { urls, fileNames };
    } catch (error) {
      console.error('Audio upload error:', error);
      throw error;
    }
  };

  const validateWalletAddresses = (): boolean => {
    if (!cryptoPaymentsEnabled) {
      return true;
    }
    
    if (walletAddresses.length === 0) {
      toast({
        title: "Wallet address required",
        description: "Please add at least one wallet address or disable crypto payments",
        variant: "destructive",
      });
      return false;
    }
    
    for (const wallet of walletAddresses) {
      if (!wallet.cryptoType || !wallet.address) {
        toast({
          title: "Incomplete wallet information",
          description: "Please fill in all wallet address fields",
          variant: "destructive",
        });
        return false;
      }
    }
    
    return true;
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
    
    if (cryptoPaymentsEnabled && !values.enablePaypal && !validateWalletAddresses()) {
      return;
    }
    
    if (!cryptoPaymentsEnabled && !values.enablePaypal) {
      toast({
        title: "Payment method required",
        description: "Please enable either crypto payments or PayPal payments",
        variant: "destructive",
      });
      return;
    }
    
    if (isAudioProduct && audioFiles.length === 0) {
      toast({
        title: "Audio files required",
        description: "Please upload at least one audio file",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const imageUrl = await uploadImage();
      
      let priceInUSD = parseFloat(values.price);
      if (values.priceCurrency !== 'usd' && cryptoPrices[values.priceCurrency]) {
        priceInUSD = parseFloat(values.price) * cryptoPrices[values.priceCurrency];
      }
      
      let audioUrls: string[] = [];
      let audioFileNames: string[] = [];
      
      if (isAudioProduct) {
        const audioUploadResult = await uploadAudioFiles();
        audioUrls = audioUploadResult.urls;
        audioFileNames = audioUploadResult.fileNames;
      }
      
      let product;
      
      if (isEditing && initialValues) {
        const { data: updatedProduct, error: updateError } = await supabase
          .from('products')
          .update({
            title: values.title,
            type: values.type,
            digital_type: values.digitalType || null,
            audio_type: values.audioType || null,
            description: values.description,
            price: priceInUSD,
            price_currency: values.priceCurrency,
            original_price: parseFloat(values.price),
            category: values.category,
            image_url: imageUrl,
            contact_phone: values.contact_phone,
            enable_paypal: values.enablePaypal,
            paypal_client_id: values.enablePaypal ? paypalClientId : null,
            artist_name: isAudioProduct ? values.artistName : null,
            publishing_year: isAudioProduct ? values.publishingYear : null,
            lyrics: isAudioProduct ? values.lyrics : null,
            audio_urls: isAudioProduct ? audioUrls : null,
            audio_file_names: isAudioProduct ? audioFileNames : null,
          })
          .eq('id', initialValues.id)
          .select()
          .single();
          
        if (updateError) throw new Error(updateError.message);
        product = updatedProduct;
        
        if (initialWalletAddresses.length > 0) {
          const { error: deleteWalletsError } = await supabase
            .from('wallet_addresses')
            .delete()
            .eq('product_id', initialValues.id);
            
          if (deleteWalletsError) throw new Error(deleteWalletsError.message);
        }
      } else {
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            user_id: user.id,
            title: values.title,
            type: values.type,
            digital_type: values.digitalType || null,
            audio_type: values.audioType || null,
            description: values.description,
            price: priceInUSD,
            price_currency: values.priceCurrency,
            original_price: parseFloat(values.price),
            category: values.category,
            image_url: imageUrl,
            contact_phone: values.contact_phone,
            enable_paypal: values.enablePaypal,
            paypal_client_id: values.enablePaypal ? paypalClientId : null,
            artist_name: isAudioProduct ? values.artistName : null,
            publishing_year: isAudioProduct ? values.publishingYear : null,
            lyrics: isAudioProduct ? values.lyrics : null,
            audio_urls: isAudioProduct ? audioUrls : null,
            audio_file_names: isAudioProduct ? audioFileNames : null,
          })
          .select()
          .single();
          
        if (productError) throw new Error(productError.message);
        product = newProduct;
      }
      
      if (cryptoPaymentsEnabled && walletAddresses.length > 0) {
        const walletData = walletAddresses.map(wallet => ({
          product_id: product.id,
          crypto_type: wallet.cryptoType,
          wallet_address: wallet.address,
        }));
        
        const { error: walletError } = await supabase
          .from('wallet_addresses')
          .insert(walletData);
          
        if (walletError) throw new Error(walletError.message);
      }
      
      toast({
        title: isEditing ? "Product updated successfully" : "Product created successfully",
        description: isEditing 
          ? "Your product has been updated in the marketplace" 
          : "Your product has been added to the marketplace",
      });
      
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
          
          {watchType === 'digital' && (
            <FormField
              control={form.control}
              name="digitalType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Digital Product Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select digital product type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="conference">Conference Call</SelectItem>
                      <SelectItem value="audio">Audio Product</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {watchType === 'digital' && watchDigitalType === 'audio' && (
            <FormField
              control={form.control}
              name="audioType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audio Product Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setAudioFiles([]);
                      setAudioFilePreviews([]);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select audio product type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="single">Single File</SelectItem>
                      <SelectItem value="collection">File Collection</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
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
          
          {isAudioProduct && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="artistName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Artist Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter artist name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="publishingYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publishing Year</FormLabel>
                      <FormControl>
                        <Input placeholder="YYYY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="lyrics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lyrics/Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter lyrics or detailed description" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-medium mb-2">
                    Audio Files {watchAudioType === 'single' ? '(Single File)' : '(Collection)'}
                  </h3>
                  
                  <div className="flex flex-col space-y-4">
                    {audioFilePreviews.length > 0 ? (
                      <div className="space-y-2">
                        {audioFilePreviews.map((file, index) => (
                          <Card key={index} className="bg-dark-secondary">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <FileAudio className="text-pi-muted" size={24} />
                                  <div>
                                    <p className="font-medium truncate max-w-[200px] md:max-w-[300px]">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-pi-muted">{file.size}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <audio src={file.url} controls className="h-8 w-32 md:w-40" />
                                  <button
                                    type="button"
                                    onClick={() => removeAudioFile(index)}
                                    className="p-1 rounded-full hover:bg-dark-accent text-pi-muted hover:text-destructive"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <label
                          htmlFor="audio-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-500 rounded-md cursor-pointer hover:border-pi-focus transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Music className="mb-2 text-pi-muted" size={24} />
                            <p className="text-sm text-pi-muted">
                              Click to upload audio file{watchAudioType === 'collection' ? 's' : ''}
                            </p>
                            <p className="text-xs text-pi-muted mt-1">
                              MP3, WAV, FLAC, M4A (max. 50MB)
                            </p>
                          </div>
                          <input
                            ref={audioInputRef}
                            id="audio-upload"
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            multiple={watchAudioType === 'collection'}
                            onChange={handleAudioFilesChange}
                          />
                        </label>
                      </div>
                    )}
                    
                    {audioFilePreviews.length > 0 && watchAudioType === 'collection' && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => audioInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload size={16} className="mr-2" />
                        Add More Audio Files
                      </Button>
                    )}
                    
                    {audioFilePreviews.length > 0 && watchAudioType === 'single' && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => audioInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload size={16} className="mr-2" />
                        Replace Audio File
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormDescription>
                    For services, this is the hourly rate. For products, this is the fixed price.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="priceCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="usd">USD (US Dollar)</option>
                      {CRYPTO_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>
                    Select the currency you want to price your product in.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {watchPrice && !isNaN(parseFloat(watchPrice)) && (
            <div className="p-4 bg-dark-secondary rounded-lg">
              <h3 className="text-md font-semibold mb-2">Price Conversions:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {watchPriceCurrency !== 'usd' && (
                  <div className="p-2 bg-dark-accent rounded-md">
                    <div className="font-medium">USD:</div>
                    <div>${convertPrice(watchPrice, watchPriceCurrency, 'usd')}</div>
                  </div>
                )}
                {CRYPTO_OPTIONS.map(option => 
                  option.value !== watchPriceCurrency && (
                    <div key={option.value} className="p-2 bg-dark-accent rounded-md">
                      <div className="font-medium">{option.label}:</div>
                      <div>{convertPrice(watchPrice, watchPriceCurrency, option.value)}</div>
                    </div>
                  )
                )}
              </div>
              <p className="text-xs text-pi-muted mt-2">
                {isLoadingPrices ? 'Loading prices...' : 'Conversions are approximate and based on current market rates.'}
              </p>
            </div>
          )}

          <FormField
            control={form.control}
            name="contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Enter your phone number for client contact" {...field} />
                </FormControl>
                <FormDescription>
                  This number will be shared with buyers after purchase for direct contact.
                </FormDescription>
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
          
          <FormField
            control={form.control}
            name="enablePaypal"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Enable PayPal Payments</FormLabel>
                  <FormDescription>
                    Allow customers to pay with PayPal in USD.
                  </FormDescription>
                  {paypalClientId ? (
                    <p className="text-xs text-green-500">PayPal Client ID is set</p>
                  ) : (
                    <p className="text-xs text-amber-500">
                      PayPal Client ID is not set. Enter it above to enable PayPal payments.
                    </p>
                  )}
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!paypalClientId}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <div className="space-y-4">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <h3 className="text-base font-medium">Enable Cryptocurrency Payments</h3>
                <p className="text-sm text-muted-foreground">
                  Accept payments in various cryptocurrencies
                </p>
              </div>
              <Switch
                checked={cryptoPaymentsEnabled}
                onCheckedChange={(checked) => {
                  setCryptoPaymentsEnabled(checked);
                  if (checked && walletAddresses.length === 0) {
                    addWalletAddress();
                  }
                }}
              />
            </div>
            
            {cryptoPaymentsEnabled && (
              <>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">Cryptocurrency Wallet Addresses</h3>
                    {form.watch('enablePaypal') && (
                      <span className="ml-2 text-xs bg-amber-500/20 text-amber-500 px-2 py-1 rounded-full">
                        Optional with PayPal enabled
                      </span>
                    )}
                  </div>
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
                    {form.watch('enablePaypal') ? (
                      <>
                        <CreditCard className="mx-auto mb-2" size={24} />
                        <p>PayPal payments are enabled</p>
                        <p className="text-sm">You can also add crypto wallet addresses as an alternative payment method</p>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="mx-auto mb-2" size={24} />
                        <p>No wallet addresses added yet</p>
                        <p className="text-sm">Click "Add Wallet" to add a payment method</p>
                      </>
                    )}
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
              </>
            )}
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
