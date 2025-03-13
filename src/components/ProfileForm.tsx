
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { User } from 'lucide-react';
import { Profile } from '@/hooks/useProfile';

export const businessTypes = [
  'Sole proprietor',
  'S Corp',
  'C Corp',
  'LLC',
  'Partnership',
  'Independent Contractor',
  'P.I.E student'
];

export const industries = [
  'Influencer',
  'Educator',
  'Astrologer',
  'Spiritualist',
  'Gamer',
  'Sports/Fitness',
  'Cooking',
  'Fashion',
  'Modeling',
  'Film',
  'Adult',
  'Undecided'
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
  const [businessType, setBusinessType] = useState<string>(profile?.business_type || businessTypes[0]); // Default to first option
  const [industry, setIndustry] = useState<string>(profile?.industry || industries[0]); // Default to first option
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(profile?.profile_photo_url || null);
  
  // Debug values
  useEffect(() => {
    console.log("Current form values:", { username, businessType, industry, profilePhotoUrl });
  }, [username, businessType, industry, profilePhotoUrl]);
  
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

    // Ensure we have valid values for businessType and industry
    const finalBusinessType = businessType || businessTypes[0];
    const finalIndustry = industry || industries[0];
    
    setIsSubmitting(true);
    
    try {
      // Create the profile data object
      const profileData = {
        username,
        business_type: finalBusinessType,
        industry: finalIndustry,
        profile_photo_url: profilePhotoUrl,
        updated_at: new Date().toISOString(),
      };

      console.log("Submitting profile data:", profileData);

      let query;
      
      if (isCreate) {
        query = supabase
          .from('profiles')
          .insert({
            id: userId,
            ...profileData,
          });
      } else {
        query = supabase
          .from('profiles')
          .update(profileData)
          .eq('id', userId);
      }
      
      const { error, data } = await query;
      
      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }
      
      console.log("Profile saved successfully:", data);
      
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
    <form onSubmit={handleSubmit} className="space-y-6 text-white">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-gray-700 bg-gray-800 flex items-center justify-center">
            {profilePhotoUrl ? (
              <img 
                src={profilePhotoUrl} 
                alt={username} 
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-12 w-12 text-gray-400" />
            )}
          </div>
          
          <div>
            <label 
              htmlFor="profile-photo" 
              className="inline-block cursor-pointer px-4 py-2 bg-gray-700 hover:bg-gray-600 transition-colors rounded-md text-sm font-medium"
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
            <p className="text-xs text-gray-400 mt-1">
              JPG, PNG or GIF. Maximum size 2MB.
            </p>
          </div>
        </div>
        
        <Separator className="my-6 bg-gray-700" />
        
        <div className="space-y-1">
          <Label htmlFor="username" className="block text-sm font-medium text-gray-300">
            Username *
          </Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="business-type" className="block text-sm font-medium text-gray-300">
              Business Type *
            </Label>
            <Select 
              value={businessType} 
              onValueChange={setBusinessType}
              defaultValue={businessTypes[0]}
            >
              <SelectTrigger id="business-type" className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {businessTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="industry" className="block text-sm font-medium text-gray-300">
              Industry *
            </Label>
            <Select 
              value={industry} 
              onValueChange={setIndustry}
              defaultValue={industries[0]}
            >
              <SelectTrigger id="industry" className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
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
          className="w-full md:w-auto bg-pi-focus hover:bg-pi-focus/90 text-white"
        >
          {isSubmitting ? (isCreate ? "Creating..." : "Updating...") : (isCreate ? "Create Profile" : "Update Profile")}
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;
