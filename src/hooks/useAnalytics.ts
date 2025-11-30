import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsData {
  totalNotes: number;
  notesThisWeek: number;
  notesThisMonth: number;
  timeSaved: number;
  avgNoteTime: number;
  templateBreakdown: Record<string, number>;
  weeklyActivity: Array<{ day: string; notes: number }>;
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    totalNotes: 0,
    notesThisWeek: 0,
    notesThisMonth: 0,
    timeSaved: 0,
    avgNoteTime: 15,
    templateBreakdown: {},
    weeklyActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all user's notes
      const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Calculate metrics
      const totalNotes = notes?.length || 0;
      const notesThisWeek = notes?.filter(n => new Date(n.created_at) >= weekAgo).length || 0;
      const notesThisMonth = notes?.filter(n => new Date(n.created_at) >= monthAgo).length || 0;
      
      // Estimate time saved (15 min per note)
      const timeSaved = Math.round((totalNotes * 15) / 60 * 10) / 10;

      // Template breakdown
      const templateBreakdown: Record<string, number> = {};
      notes?.forEach(note => {
        templateBreakdown[note.template] = (templateBreakdown[note.template] || 0) + 1;
      });

      // Weekly activity (last 7 days)
      const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const notesOnDay = notes?.filter(n => {
          const noteDate = new Date(n.created_at);
          return noteDate >= dayStart && noteDate <= dayEnd;
        }).length || 0;

        return { day: dayName, notes: notesOnDay };
      }).reverse();

      setData({
        totalNotes,
        notesThisWeek,
        notesThisMonth,
        timeSaved,
        avgNoteTime: 15,
        templateBreakdown,
        weeklyActivity,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    refresh: loadAnalytics,
  };
}