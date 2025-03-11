
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './use-toast';

export const useAstrologyMessage = () => {
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchAstrologyMessage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    if (!user || !profile || !profile.zodiac_sign) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching astrology message for:', {
        userId: user.id,
        zodiacSign: profile.zodiac_sign,
        firstName: profile.first_name
      });

      const { data, error } = await supabase.functions.invoke('daily-astrology', {
        body: {
          userId: user.id,
          zodiacSign: profile.zodiac_sign,
          firstName: profile.first_name
        }
      });

      if (error) {
        console.error('Error fetching astrology message:', error);
        setError(error.message);
        toast({
          title: 'Could not load your daily insight',
          description: 'Please try again later',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      console.log('Received response from daily-astrology function:', data);

      if (data?.message) {
        setMessage(data.message);
      } else {
        console.error('No message received from daily-astrology function');
        setError('No message received');
      }
    } catch (error: any) {
      console.error('Error in fetchAstrologyMessage:', error);
      setError(error.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, toast]);

  useEffect(() => {
    fetchAstrologyMessage();
  }, [fetchAstrologyMessage]);

  return { message, isLoading, error, refetch: fetchAstrologyMessage };
};
