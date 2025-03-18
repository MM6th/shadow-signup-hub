
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Camera, Coins, CreditCard } from 'lucide-react';

interface LiveStreamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormValues {
  title: string;
  enableCrypto: boolean;
  enablePaypal: boolean;
}

const LiveStreamModal: React.FC<LiveStreamModalProps> = ({ open, onOpenChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const form = useForm<FormValues>({
    defaultValues: {
      title: '',
      enableCrypto: false,
      enablePaypal: false
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setThumbnail(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to start a live stream",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      const conferenceId = uuidv4();
      let thumbnailUrl = null;
      
      // Upload thumbnail if provided
      if (thumbnail) {
        const fileExt = thumbnail.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `livestream-thumbnails/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, thumbnail);
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
          
        thumbnailUrl = urlData.publicUrl;
      }
      
      // Create a new livestream record
      const { error } = await supabase
        .from('livestreams')
        .insert({
          title: data.title,
          thumbnail_url: thumbnailUrl,
          conference_id: conferenceId,
          user_id: user.id,
          enable_crypto: data.enableCrypto,
          enable_paypal: data.enablePaypal,
          is_active: true,
          views: 0
        });
        
      if (error) throw error;
      
      toast({
        title: "Stream created",
        description: "Your live stream has been set up successfully!"
      });
      
      // Close modal and navigate to the livestream page
      onOpenChange(false);
      navigate(`/livestream/${conferenceId}`);
      
    } catch (error: any) {
      console.error('Error creating livestream:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create the live stream",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Live Stream</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stream Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a title for your stream" {...field} />
                  </FormControl>
                  <FormDescription>
                    Give your stream a descriptive title that will attract viewers.
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Thumbnail</FormLabel>
              <div className="flex flex-col items-center justify-center gap-4">
                <div 
                  className="w-full aspect-video rounded-md border border-input overflow-hidden flex items-center justify-center bg-dark-secondary"
                >
                  {thumbnailPreview ? (
                    <img 
                      src={thumbnailPreview} 
                      alt="Thumbnail Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera size={36} className="text-pi-muted" />
                  )}
                </div>
                
                <div className="flex items-center justify-center w-full">
                  <label 
                    htmlFor="thumbnail-upload" 
                    className="flex flex-col items-center justify-center w-full cursor-pointer"
                  >
                    <Button type="button" variant="outline" className="w-full">
                      {thumbnailPreview ? "Change Thumbnail" : "Upload Thumbnail"}
                    </Button>
                    <input
                      id="thumbnail-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <FormLabel>Payment Options</FormLabel>
              
              <FormField
                control={form.control}
                name="enableCrypto"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center space-x-2">
                      <Coins size={18} />
                      <div className="space-y-0.5">
                        <FormLabel>Cryptocurrency</FormLabel>
                        <FormDescription>Accept crypto payments</FormDescription>
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="enablePaypal"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center space-x-2">
                      <CreditCard size={18} />
                      <div className="space-y-0.5">
                        <FormLabel>PayPal</FormLabel>
                        <FormDescription>Accept PayPal payments</FormDescription>
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="rounded-lg border p-3 text-center">
                <div className="font-medium">Conference ID</div>
                <div className="text-pi-muted text-sm">
                  A unique ID will be generated when you start the stream
                </div>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isUploading || !form.getValues().title}
            >
              {isUploading ? "Setting Up..." : "Start Live Stream"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default LiveStreamModal;
