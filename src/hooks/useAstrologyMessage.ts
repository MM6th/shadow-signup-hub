
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './use-toast';

export const useAstrologyMessage = () => {
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAstrologyMessage = async () => {
      if (!user || !profile || !profile.zodiac_sign) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('daily-astrology', {
          body: {
            userId: user.id,
            zodiacSign: profile.zodiac_sign,
            firstName: profile.first_name
          }
        });

        if (error) {
          console.error('Error fetching astrology message:', error);
          toast({
            title: 'Could not load your daily insight',
            description: 'Please try again later',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        if (data?.message) {
          setMessage(data.message);
        }
      } catch (error) {
        console.error('Error in fetchAstrologyMessage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAstrologyMessage();
  }, [user, profile, toast]);

  return { message, isLoading };
};
