import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Image, Video, Upload, X, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const adFormSchema = z.object({
  title: z.string().max(75, "Caption must be 75 characters or less").min(1, "Caption is required"),
  mediaType: z.enum(["image", "video"]),
  productUrl: z.string().optional(),
});

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB for a short 10-second video

interface AdFormProps {
  onAdCreated?: () => void;
}

const AdForm: React.FC<AdFormProps> = ({ onAdCreated }) => {
  const { user, profile } = useAuth();
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [charCount, setCharCount] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof adFormSchema>>({
    resolver: zodResolver(adFormSchema),
    defaultValues: {
      title: "",
      mediaType: "image",
      productUrl: "",
    },
  });

  const mediaType = form.watch("mediaType");
  const title = form.watch("title");

  // Update character count when title changes
  useEffect(() => {
    setCharCount(title.length);
  }, [title]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      
      try {
        setIsLoadingProducts(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error loading products",
          description: "Unable to load your products. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProducts(false);
      }
    };
    
    fetchProducts();
  }, [user, toast]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    
    if (file.size > maxSize) {
      const sizeInMB = maxSize / (1024 * 1024);
      toast({
        title: "File too large",
        description: `${isImage ? "Image" : "Video"} must be smaller than ${sizeInMB}MB`,
        variant: "destructive",
      });
      return;
    }
    
    if ((isImage && mediaType === 'image') || (isVideo && mediaType === 'video')) {
      const reader = new FileReader();
      reader.onload = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setMediaFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: `Please select a ${mediaType} file`,
        variant: "destructive",
      });
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const uploadMedia = async (): Promise<string | null> => {
    if (!mediaFile || !user) return null;
    
    try {
      const fileExt = mediaFile.name.split('.').pop();
      const filePath = `${user.id}/${uuidv4()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('ad_media')
        .upload(filePath, mediaFile);
        
      if (uploadError) {
        throw new Error(uploadError.message);
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('ad_media')
        .getPublicUrl(filePath);
        
      return publicUrl;
    } catch (error) {
      console.error('Media upload error:', error);
      throw error;
    }
  };

  const onSubmit = async (values: z.infer<typeof adFormSchema>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create an ad",
        variant: "destructive",
      });
      return;
    }
    
    if (!mediaFile) {
      toast({
        title: "Media required",
        description: `Please upload a ${values.mediaType} for your ad`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const mediaUrl = await uploadMedia();
      
      if (!mediaUrl) {
        throw new Error("Failed to upload media");
      }
      
      const { data: ad, error: adError } = await supabase
        .from('ads')
        .insert({
          user_id: user.id,
          title: values.title,
          media_type: values.mediaType,
          media_url: mediaUrl,
          product_url: values.productUrl || null,
          industry: profile?.industry || null
        })
        .select()
        .single();
        
      if (adError) throw adError;
      
      toast({
        title: "Ad created successfully",
        description: "Your ad has been created and will be displayed in the marketplace",
      });
      
      form.reset();
      setMediaFile(null);
      setMediaPreview(null);
      
      if (onAdCreated) {
        onAdCreated();
      }
      
    } catch (error) {
      console.error('Error creating ad:', error);
      toast({
        title: "Error creating ad",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-elixia text-gradient mb-6">Create New Advertisement</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Caption</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="Enter a captivating caption for your ad" 
                      {...field} 
                      maxLength={75}
                    />
                    <div className="absolute right-2 top-2 text-xs text-muted-foreground">
                      {charCount}/75
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
                  Maximum 75 characters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="mediaType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Media Type</FormLabel>
                <FormControl>
                  <Tabs 
                    value={field.value} 
                    onValueChange={field.onChange}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-2 w-full">
                      <TabsTrigger value="image" className="flex items-center gap-2">
                        <Image size={16} />
                        Image
                      </TabsTrigger>
                      <TabsTrigger value="video" className="flex items-center gap-2">
                        <Video size={16} />
                        Video
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="image" className="pt-4">
                      <div className="text-sm text-muted-foreground">
                        Upload an image (max 2MB)
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="video" className="pt-4">
                      <div className="text-sm text-muted-foreground">
                        Upload a short video (max 10 seconds, 10MB)
                      </div>
                    </TabsContent>
                  </Tabs>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div>
            <FormLabel>Upload {mediaType}</FormLabel>
            <div className="mt-1">
              {mediaPreview ? (
                <div className="relative w-full h-64 rounded-md overflow-hidden mb-2 bg-dark-secondary">
                  {mediaType === 'image' ? (
                    <img 
                      src={mediaPreview} 
                      alt="Ad preview" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <video 
                      src={mediaPreview} 
                      controls 
                      className="w-full h-full object-contain"
                    />
                  )}
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="media-upload"
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-500 rounded-md cursor-pointer hover:border-primary transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="mb-2 text-muted-foreground" size={24} />
                      <p className="text-sm text-muted-foreground">
                        Click to upload {mediaType === 'image' ? 'an image' : 'a video'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {mediaType === 'image' 
                          ? 'PNG, JPG, GIF up to 2MB' 
                          : 'MP4, WebM up to 10MB (10 sec max)'}
                      </p>
                    </div>
                    <input
                      id="media-upload"
                      type="file"
                      accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                      className="hidden"
                      onChange={handleMediaChange}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
          
          <FormField
            control={form.control}
            name="productUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link to Product (Optional)</FormLabel>
                <div className="flex items-center gap-2">
                  <Link size={16} className="text-muted-foreground" />
                  <FormControl>
                    <Select 
                      value={field.value || ""} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a product to link" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </div>
                <FormDescription>
                  Link this ad to one of your products in the marketplace
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Ad'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AdForm;
