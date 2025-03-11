
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  profile_photo_url: string | null;
  date_of_birth: string;
  time_of_birth: string | null;
  place_of_birth: string | null;
  show_zodiac_sign: boolean;
  business_type: string | null;
  industry: string | null;
  zodiac_sign: string | null;
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
        
      if (!error) {
        // When receiving profile data from the database, we don't need to manipulate the date
        // Just use it as is from the database
        setProfile(profileData);
        return profileData;
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
