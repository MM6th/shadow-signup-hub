
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export type Profile = {
  id: string;
  username: string;
  profile_photo_url: string | null;
  business_type: string | null;
  industry: string | null;
};

export const useProfile = (userId: string | undefined) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchProfile = async (uid: string) => {
    try {
      console.log("Fetching profile for user ID:", uid);
      
      if (!uid) {
        console.error('No user ID provided');
        setIsLoading(false);
        return null;
      }
      
      // First try to get the profile from profiles table
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        setIsLoading(false);
        return null;
      }
      
      console.log("Profile data returned:", profileData);
      
      if (profileData) {
        // Make sure the profile photo URL is valid
        let photoUrl = profileData.profile_photo_url;
        
        // If the profile has a photo URL but it's not working correctly,
        // we make sure it's a proper URL from the Supabase storage
        if (photoUrl && !photoUrl.startsWith('http')) {
          const { data } = supabase.storage
            .from('profiles')
            .getPublicUrl(photoUrl);
          photoUrl = data.publicUrl;
        }
        
        // Map the database fields to our Profile type
        const mappedProfile: Profile = {
          id: profileData.id,
          username: profileData.username || 'Anonymous',
          profile_photo_url: photoUrl,
          business_type: profileData.business_type,
          industry: profileData.industry
        };
        
        console.log("Mapped profile:", mappedProfile);
        setProfile(mappedProfile);
        setIsLoading(false);
        return mappedProfile;
      } else {
        console.log("No profile found for user:", uid);
        setIsLoading(false);
        return null;
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setIsLoading(false);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (userId) {
      setIsLoading(true);
      await fetchProfile(userId);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  return { profile, isLoading, refreshProfile };
};
