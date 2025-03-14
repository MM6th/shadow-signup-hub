
import React, { createContext, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { useProfile } from '@/hooks/useProfile';
import type { Profile } from '@/hooks/useProfile';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasProfile: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, isLoading: sessionLoading, clearSession } = useUserSession();
  const { profile, isLoading: profileLoading, refreshProfile } = useProfile(user?.id);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!sessionLoading && !profileLoading) {
      const currentPath = location.pathname;
      
      if (user) {
        // Check if the user has a profile
        if (!profile && currentPath !== '/create-profile') {
          // If the user doesn't have a profile and is not already on the create profile page, redirect them
          navigate('/create-profile');
        } else if (profile && (currentPath === '/' || currentPath === '/create-profile')) {
          // If the user has a profile and is on the home or create profile page, redirect to dashboard
          navigate('/dashboard');
        }
      }
    }
  }, [user, profile, sessionLoading, profileLoading, navigate, location.pathname]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      toast({
        title: "Signed in successfully",
        description: "Welcome back!",
      });
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      
      if (error) throw error;
      
      toast({
        title: "Account created",
        description: "Please check your email to confirm your account.",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      
      // Clear the local session state
      clearSession();
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      
      // Force navigate to home page
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const hasProfile = !!profile;
  const isLoading = sessionLoading || profileLoading;

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      isLoading,
      signIn, 
      signUp, 
      signOut,
      hasProfile,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
