
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

// Admin user IDs - centralized in one place
export const ADMIN_IDS = ['f64a94e3-3adf-4409-978d-f3106aabf598', '3a25fea8-ec60-4e52-ae40-63f2b1ce89d9'];

export const useUserSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user || null);
        
        // Check if user is admin
        if (data.session?.user) {
          setIsAdmin(ADMIN_IDS.includes(data.session.user.id));
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session ? 'Has session' : 'No session');
      setSession(session);
      setUser(session?.user || null);
      
      // Check if user is admin
      if (session?.user) {
        setIsAdmin(ADMIN_IDS.includes(session.user.id));
      } else {
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Add a function to clear session data when signing out
  const clearSession = useCallback(() => {
    try {
      console.log('Clearing session in useUserSession');
      setUser(null);
      setSession(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }, []);

  return { user, session, isLoading, clearSession, isAdmin };
};
