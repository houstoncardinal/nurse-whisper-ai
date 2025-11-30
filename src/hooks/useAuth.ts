import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  department: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Supabase is properly configured
    const hasSupabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!hasSupabase) {
      console.warn('Supabase not configured - running in offline mode');
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      // Check if Supabase is available
      if (!import.meta.env.VITE_SUPABASE_URL) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    // Check if Supabase is available
    if (!import.meta.env.VITE_SUPABASE_URL) {
      toast.error('Database not available');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      await loadProfile(user.id);
      toast.success('Profile updated');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const signOut = async () => {
    // Check if Supabase is available
    if (!import.meta.env.VITE_SUPABASE_URL) {
      toast.info('No active session');
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  return {
    user,
    profile,
    loading,
    updateProfile,
    signOut,
  };
}