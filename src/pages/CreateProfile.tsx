import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Upload, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const businessTypes = ['Sole Proprietorship', 'S Corp', 'C Corp', 'LLC', 'P.I.E student'] as const;
const industryTypes = [
  'Influencer', 'Educator', 'Astrologer', 'Spiritualist', 
  'Gamer', 'Sports', 'Cooking', 'Fashion', 'Adult', 'Film', 'Undecided'
] as const;

const formSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  business_type: z.enum(businessTypes).optional(),
  industry: z.enum(industryTypes).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CreateProfile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
    },
  });

  useEffect(() => {
    if (profile) {
      setIsEditing(true);
      
      try {
        form.reset({
          username: profile.username,
          business_type: profile.business_type as any || undefined,
          industry: profile.industry as any || undefined,
        });
        
        if (profile.profile_photo_url) {
          setProfileImageUrl(profile.profile_photo_url);
        }
      } catch (error) {
        console.error("Error setting form values:", error);
      }
    }
  }, [profile, form]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const objectUrl = URL.createObjectURL(file);
      setProfileImageUrl(objectUrl);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImage || !user) return null;

    try {
      setIsUploading(true);
      const fileExt = profileImage.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, profileImage);

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error: any) {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!user) return;

    try {
      setIsUploading(true);
      const profilePhotoUrl = profileImage ? await uploadProfileImage() : profileImageUrl;

      const currentDate = new Date().toISOString().split('T')[0];

      const profileData = {
        username: data.username,
        first_name: data.username.split(' ')[0] || data.username,
        last_name: data.username.split(' ').slice(1).join(' ') || '',
        profile_photo_url: profilePhotoUrl,
        business_type: data.business_type,
        industry: data.industry,
        date_of_birth: currentDate
      };

      let error;
      
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id);
          
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            ...profileData
          });
          
        error = insertError;
      }

      if (error) {
        throw error;
      }

      await refreshProfile();

      toast({
        title: isEditing ? "Profile updated!" : "Profile created!",
        description: isEditing 
          ? "Your profile has been updated successfully." 
          : "Your profile has been created successfully.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: isEditing ? "Error updating profile" : "Error creating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark bg-dark-gradient text-pi py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-xl p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-elixia mb-6 text-center text-gradient">
            {isEditing ? 'Edit Your Profile' : 'Create Your Profile'}
          </h1>
          
          <div className="mb-8 flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              {profileImageUrl ? (
                <img 
                  src={profileImageUrl} 
                  alt="Profile preview" 
                  className="w-full h-full object-cover rounded-full border-2 border-pi-focus/30"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center rounded-full bg-dark-secondary border border-white/10">
                  <Camera size={40} className="text-pi-muted" />
                </div>
              )}
              
              <label 
                htmlFor="profile-image" 
                className="absolute bottom-0 right-0 p-2 bg-pi-focus rounded-full cursor-pointer hover:bg-pi-focus/90 transition-colors"
              >
                <Upload size={16} className="text-white" />
              </label>
              <input 
                id="profile-image" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
              />
            </div>
            <p className="text-sm text-pi-muted">Upload profile photo</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your username" 
                        {...field} 
                        className="bg-dark-secondary border border-white/10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="business_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-dark-secondary border border-white/10">
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-dark-secondary border border-white/10">
                          <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                          <SelectItem value="S Corp">S Corp</SelectItem>
                          <SelectItem value="C Corp">C Corp</SelectItem>
                          <SelectItem value="LLC">LLC</SelectItem>
                          <SelectItem value="P.I.E student">P.I.E student</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the type of business entity you operate.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-dark-secondary border border-white/10">
                            <SelectValue placeholder="Select your industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-dark-secondary border border-white/10 max-h-60">
                          <SelectItem value="Influencer">Influencer</SelectItem>
                          <SelectItem value="Educator">Educator</SelectItem>
                          <SelectItem value="Astrologer">Astrologer</SelectItem>
                          <SelectItem value="Spiritualist">Spiritualist</SelectItem>
                          <SelectItem value="Gamer">Gamer</SelectItem>
                          <SelectItem value="Sports">Sports</SelectItem>
                          <SelectItem value="Cooking">Cooking</SelectItem>
                          <SelectItem value="Fashion">Fashion</SelectItem>
                          <SelectItem value="Adult">Adult</SelectItem>
                          <SelectItem value="Film">Film</SelectItem>
                          <SelectItem value="Undecided">Undecided</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the industry that best describes your work.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 mt-8"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>Uploading... <span className="animate-spin ml-1">⟳</span></>
                ) : (
                  <>
                    <Save size={18} /> {isEditing ? 'Update Profile' : 'Create Profile'}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default CreateProfile;
