
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

// Validation schema for the form
const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }).max(100),
  enableCrypto: z.boolean().default(false),
  enablePaypal: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface LiveStreamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void; 
}

const LiveStreamModal: React.FC<LiveStreamModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      enableCrypto: false,
      enablePaypal: false,
    }
  });
  
  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to start a live stream",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Generate a unique conference ID
      const conferenceId = uuidv4();
      
      // Create a new live stream record
      const { data: liveStreamData, error } = await supabase
        .from('livestreams')
        .insert({
          title: data.title,
          conference_id: conferenceId,
          user_id: user.id,
          enable_crypto: data.enableCrypto,
          enable_paypal: data.enablePaypal,
          is_active: true,
          views: 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create an initial stream session
      const { error: sessionError } = await supabase
        .from('stream_sessions')
        .insert({
          id: conferenceId,
          host_id: user.id,
          offer_candidates: [],
          answer_candidates: []
        });
        
      if (sessionError) {
        console.error("Stream session creation error:", sessionError);
        // Continue anyway, the session will be created when starting the stream
      }
      
      toast({
        title: "Live stream created",
        description: "Your live stream has been set up successfully",
      });
      
      // Close the modal
      onOpenChange(false);
      
      // Reset the form
      reset();
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Navigate to the live stream page
      navigate(`/livestream/${conferenceId}`);
      
    } catch (error: any) {
      console.error('Error creating live stream:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create live stream",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Clean up form when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start a New Live Stream</DialogTitle>
          <DialogDescription>
            Set up your livestream to connect with your audience
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Stream Title</Label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input
                    id="title"
                    placeholder="Enter a title for your stream"
                    {...field}
                    disabled={isCreating}
                  />
                )}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableCrypto">Accept Crypto Payments</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow viewers to support you with cryptocurrency
                  </p>
                </div>
                <Controller
                  name="enableCrypto"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="enableCrypto"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isCreating}
                    />
                  )}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enablePaypal">Accept PayPal</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow viewers to support you via PayPal
                  </p>
                </div>
                <Controller
                  name="enablePaypal"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="enablePaypal"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isCreating}
                    />
                  )}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader size={16} className="mr-2 animate-spin" />
                  Setting Up...
                </>
              ) : (
                <>
                  Go Live
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LiveStreamModal;
