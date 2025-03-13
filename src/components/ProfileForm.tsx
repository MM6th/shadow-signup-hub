
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { User } from 'lucide-react';
import { Profile } from '@/hooks/useProfile';

export const businessTypes = [
  'Sole Proprietorship',
  'Limited Liability Company (LLC)',
  'Corporation',
  'Partnership',
  'Non-profit',
  'Freelancer',
  'Other'
];

export const industries = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Retail',
  'Manufacturing',
  'Entertainment',
  'Real Estate',
  'Consulting',
  'Marketing',
  'Legal',
  'Art & Design',
  'Wellness & Health',
  'Spirituality',
  'Astrology',
  'Other'
];

interface ProfileFormProps {
  userId: string;
  profile: Profile | null;
  onSuccess: () => void;
  isCreate?: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ 
  userId, 
  profile, 
  onSuccess,
  isCreate = false
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const [businessType, setBusinessType] = useState<string | null>(profile?.business_type || null);
  const [industry, setIndustry] = useState<string | null>(profile?.industry || null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(profile?.profile_photo_url || null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to update your profile.",
        variant: "destructive",
      });
      return;
    }
    
    if (!username.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter a username.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const profileData = {
        username,
        business_type: businessType,
        industry,
        profile_photo_url: profilePhotoUrl,
        updated_at: new Date().toISOString(),
      };

      let query;
      
      if (isCreate) {
        // Create a new profile
        query = supabase
          .from('profiles')
          .insert({
            id: userId,
            ...profileData,
            date_of_birth: new Date().toISOString(), // Required field
          });
      } else {
        // Update existing profile
        query = supabase
          .from('profiles')
          .update(profileData)
          .eq('id', userId);
      }
      
      const { error } = await query;
      
      if (error) throw error;
      
      toast({
        title: isCreate ? "Profile Created" : "Profile Updated",
        description: isCreate 
          ? "Your profile has been successfully created." 
          : "Your profile has been successfully updated.",
      });
      
      onSuccess();
      
      if (isCreate) {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: isCreate ? "Creation Failed" : "Update Failed",
        description: error.message || `Failed to ${isCreate ? 'create' : 'update'} profile. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `profile_photos/${fileName}`;
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
      
      if (data) {
        setProfilePhotoUrl(data.publicUrl);
      }
    } catch (error: any) {
      console.error('Error uploading profile photo:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile photo. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-dark-accent bg-dark-secondary flex items-center justify-center">
            {profilePhotoUrl ? (
              <img 
                src={profilePhotoUrl} 
                alt={username} 
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-12 w-12 text-pi-muted" />
            )}
          </div>
          
          <div>
            <label 
              htmlFor="profile-photo" 
              className="inline-block cursor-pointer px-4 py-2 bg-dark-secondary hover:bg-dark-accent transition-colors rounded-md text-sm font-medium"
            >
              Change Photo
            </label>
            <input 
              type="file" 
              id="profile-photo" 
              accept="image/*" 
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <p className="text-xs text-pi-muted mt-1">
              JPG, PNG or GIF. Maximum size 2MB.
            </p>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div className="space-y-1">
          <label htmlFor="username" className="block text-sm font-medium">
            Username *
          </label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="bg-dark-secondary border-dark-accent"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="business-type" className="block text-sm font-medium">
              Business Type
            </label>
            <Select 
              value={businessType || ''} 
              onValueChange={setBusinessType}
            >
              <SelectTrigger className="bg-dark-secondary border-dark-accent">
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {businessTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <label htmlFor="industry" className="block text-sm font-medium">
              Industry
            </label>
            <Select 
              value={industry || ''} 
              onValueChange={setIndustry}
            >
              <SelectTrigger className="bg-dark-secondary border-dark-accent">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {industries.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="pt-4 flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full md:w-auto"
        >
          {isSubmitting ? (isCreate ? "Creating..." : "Updating...") : (isCreate ? "Create Profile" : "Update Profile")}
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;
