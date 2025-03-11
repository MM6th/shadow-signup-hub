
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parse } from 'date-fns';
import { CalendarIcon, Clock, MapPin, Camera, Upload, EyeOff, Eye, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters." }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  date_of_birth: z.date({ required_error: "Date of birth is required." }),
  time_of_birth: z.string().optional(),
  place_of_birth: z.string().optional(),
  show_zodiac_sign: z.boolean().default(false),
  business_type: z.enum(['Sole Proprietorship', 'S Corp', 'C Corp', 'LLC']).optional(),
  industry: z.enum([
    'Influencer', 'Educator', 'Astrologer', 'Spiritualist', 
    'Gamer', 'Sports', 'Cooking', 'Fashion', 'Adult', 'Film'
  ]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CreateProfile: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      show_zodiac_sign: false,
    },
  });

  // Load existing profile data when editing
  useEffect(() => {
    if (profile) {
      setIsEditing(true);
      
      try {
        // Parse the date string from profile correctly
        const dateOfBirth = new Date(profile.date_of_birth);
        
        // Set initial form values
        form.reset({
          first_name: profile.first_name,
          last_name: profile.last_name,
          date_of_birth: dateOfBirth,
          time_of_birth: profile.time_of_birth || undefined,
          place_of_birth: profile.place_of_birth || undefined,
          show_zodiac_sign: profile.show_zodiac_sign || false,
          business_type: profile.business_type as any || undefined,
          industry: profile.industry as any || undefined,
        });
        
        // Set profile image URL if it exists
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
      // Create a preview URL
      const objectUrl = URL.createObjectURL(file);
      setProfileImageUrl(objectUrl);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImage || !user) return null;

    try {
      setIsUploading(true);
      const fileExt = profileImage.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, profileImage);

      if (error) {
        throw error;
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

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
      // First upload the profile image if there is one
      const profilePhotoUrl = profileImage ? await uploadProfileImage() : profileImageUrl;

      const profileData = {
        first_name: data.first_name,
        last_name: data.last_name,
        profile_photo_url: profilePhotoUrl,
        date_of_birth: format(data.date_of_birth, 'yyyy-MM-dd'),
        time_of_birth: data.time_of_birth,
        place_of_birth: data.place_of_birth,
        show_zodiac_sign: data.show_zodiac_sign,
        business_type: data.business_type,
        industry: data.industry,
      };

      let error;
      
      if (isEditing) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id);
          
        error = updateError;
      } else {
        // Create new profile
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

      toast({
        title: isEditing ? "Profile updated!" : "Profile created!",
        description: isEditing 
          ? "Your profile has been updated successfully." 
          : "Your profile has been created successfully.",
      });

      // Redirect to dashboard
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your first name" 
                          {...field} 
                          className="bg-dark-secondary border border-white/10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your last name" 
                          {...field} 
                          className="bg-dark-secondary border border-white/10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal bg-dark-secondary border border-white/10",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "MM/dd/yyyy")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Your date of birth is required to calculate your zodiac sign.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="time_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time of Birth (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="time"
                            placeholder="Select time" 
                            {...field} 
                            className="bg-dark-secondary border border-white/10 pl-10"
                          />
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pi-muted w-4 h-4" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        This information helps with more precise astrological readings.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="place_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Place of Birth (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="e.g., New York, USA" 
                            {...field} 
                            className="bg-dark-secondary border border-white/10 pl-10"
                          />
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pi-muted w-4 h-4" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        The location where you were born.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="show_zodiac_sign"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border border-white/10 bg-dark-secondary">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Show Zodiac Sign</FormLabel>
                      <FormDescription>
                        Allow your zodiac sign to be visible on your public profile.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        {field.value ? (
                          <Eye className="h-4 w-4 text-pi-muted" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-pi-muted" />
                        )}
                      </div>
                    </FormControl>
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
