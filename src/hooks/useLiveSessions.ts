
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
  // Added explicit type for profiles
  profiles?: {
    username?: string;
    profile_photo_url?: string;
  };
  // These will be populated from profiles
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

  // Fetch all active live sessions
  const fetchLiveSessions = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('live_sessions')
        .select(`
          *,
          profiles:user_id (
            username,
            profile_photo_url
          )
        `)
        .eq('is_active', true)
        .order('started_at', { ascending: false });
      
      if (error) throw error;

      // Transform data to include the profile information at top level
      const sessionsWithProfiles = data.map(session => {
        // Make TypeScript happy by checking if profiles exists
        const profiles = session.profiles as { username?: string; profile_photo_url?: string } | null;
        
        return {
          ...session,
          username: profiles?.username,
          profile_photo_url: profiles?.profile_photo_url
        };
      });
      
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

  // Check if current user has an active session
  const fetchUserLiveSession = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .maybeSingle();
      
      if (error) throw error;
      
      setUserLiveSession(data || null);
    } catch (error) {
      console.error('Error fetching user live session:', error);
    }
  };

  // Start a new live session
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
      
      // Generate a unique room ID
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
      
      // Navigate to the video conference room
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

  // End the current live session
  const endLiveSession = async () => {
    if (!user || !userLiveSession) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('live_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', userLiveSession.id);
      
      if (error) throw error;
      
      setUserLiveSession(null);
      
      toast({
        title: 'Live Session Ended',
        description: 'Your live session has ended',
      });
    } catch (error) {
      console.error('Error ending live session:', error);
      toast({
        title: 'Failed to end live session',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Join an existing live session
  const joinLiveSession = (roomId: string) => {
    navigate(`/video-conference/${roomId}`);
  };

  // Set up realtime subscription for live sessions
  useEffect(() => {
    fetchLiveSessions();
    
    // Set up Supabase realtime subscription
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

  // Get the current user's active session
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
