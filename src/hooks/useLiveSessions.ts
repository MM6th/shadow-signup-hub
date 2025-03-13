import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useNavigate } from 'react-router-dom';

export interface LiveSession {
  id: string;
  user_id: string;
  room_id: string;
  title: string;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  // For the profiles relation data
  username?: string;
  profile_photo_url?: string;
}

export const useLiveSessions = () => {
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [userLiveSession, setUserLiveSession] = useState<LiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchLiveSessions = async () => {
    try {
      setIsLoading(true);
      
      const { data: sessionsData, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('is_active', true)
        .order('started_at', { ascending: false });
      
      if (error) throw error;

      const sessionsWithProfiles = await Promise.all(
        sessionsData.map(async (session) => {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, profile_photo_url')
            .eq('id', session.user_id)
            .maybeSingle();
          
          return {
            ...session,
            username: profileData?.username || 'Anonymous',
            profile_photo_url: profileData?.profile_photo_url || null,
          } as LiveSession;
        })
      );
      
      setLiveSessions(sessionsWithProfiles);
    } catch (error) {
      console.error('Error fetching live sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load live sessions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserLiveSession = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching user live session for user:', user.id);
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .maybeSingle();
      
      if (error) throw error;
      
      console.log('User live session data:', data);
      setUserLiveSession(data || null);
    } catch (error) {
      console.error('Error fetching user live session:', error);
    }
  };

  const startLiveSession = async (title: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to start a live session',
        variant: 'destructive',
      });
      return null;
    }
    
    try {
      setIsLoading(true);
      
      const roomId = `${user.id.substring(0, 8)}-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('live_sessions')
        .insert({
          user_id: user.id,
          room_id: roomId,
          title: title,
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setUserLiveSession(data);
      
      toast({
        title: 'Live Session Started',
        description: 'Your live session has started successfully',
      });
      
      navigate(`/video-conference/${roomId}`);
      
      return data;
    } catch (error) {
      console.error('Error starting live session:', error);
      toast({
        title: 'Failed to start live session',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const endLiveSession = async () => {
    if (!user || !userLiveSession) {
      console.log('No user or active session to end');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('live_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', userLiveSession.id)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Supabase error ending session:', error);
        throw error;
      }
      
      console.log('Session ended successfully');
      setUserLiveSession(null);
      
      fetchLiveSessions();
    } catch (error) {
      console.error('Error ending live session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const joinLiveSession = (roomId: string) => {
    navigate(`/video-conference/${roomId}`);
  };

  useEffect(() => {
    fetchLiveSessions();
    
    const subscription = supabase
      .channel('live_sessions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'live_sessions' }, 
        () => {
          fetchLiveSessions();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserLiveSession();
    } else {
      setUserLiveSession(null);
    }
  }, [user]);

  return {
    liveSessions,
    userLiveSession,
    isLoading,
    startLiveSession,
    endLiveSession,
    joinLiveSession,
    fetchLiveSessions,
    fetchUserLiveSession
  };
};
