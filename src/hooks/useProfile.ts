
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
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();
        
      if (!error && profileData) {
        // Map the database fields to our Profile type
        const mappedProfile: Profile = {
          id: profileData.id,
          username: profileData.username,
          profile_photo_url: profileData.profile_photo_url,
          business_type: profileData.business_type,
          industry: profileData.industry
        };
        
        setProfile(mappedProfile);
        return mappedProfile;
      } else {
        console.error('Error fetching profile:', error);
        return null;
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (userId) {
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
