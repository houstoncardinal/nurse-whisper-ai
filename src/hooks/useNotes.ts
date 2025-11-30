import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Note {
  id: string;
  user_id: string;
  organization_id?: string;
  title: string;
  template: string;
  content: Record<string, string>;
  transcript?: string;
  status: 'draft' | 'finalized' | 'archived';
  icd10_codes?: Array<{ code: string; description: string }>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  finalized_at?: string;
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load notes
  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotes((data as any[]) || []);
    } catch (err: any) {
      console.error('Error loading notes:', err);
      setError(err.message);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  // Create note
  const createNote = async (noteData: {
    title: string;
    template: string;
    content: Record<string, string>;
    transcript?: string;
    status?: 'draft' | 'finalized';
    icd10_codes?: Array<{ code: string; description: string }>;
    metadata?: Record<string, any>;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          ...noteData,
          status: noteData.status || 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => [data as any, ...prev]);
      toast.success('Note saved successfully');
      
      // Log audit
      await logAudit('create', 'note', data.id);
      
      return data;
    } catch (err: any) {
      console.error('Error creating note:', err);
      toast.error('Failed to save note');
      throw err;
    }
  };

  // Update note
  const updateNote = async (id: string, updates: Partial<Note>) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => prev.map(n => n.id === id ? data as any : n));
      toast.success('Note updated');
      
      // Log audit
      await logAudit('update', 'note', id);
      
      return data;
    } catch (err: any) {
      console.error('Error updating note:', err);
      toast.error('Failed to update note');
      throw err;
    }
  };

  // Delete note
  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotes(prev => prev.filter(n => n.id !== id));
      toast.success('Note deleted');
      
      // Log audit
      await logAudit('delete', 'note', id);
    } catch (err: any) {
      console.error('Error deleting note:', err);
      toast.error('Failed to delete note');
      throw err;
    }
  };

  // Log audit trail (HIPAA compliance)
  const logAudit = async (action: string, resourceType: string, resourceId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: action as any,
        resource_type: resourceType,
        resource_id: resourceId,
        details: { timestamp: new Date().toISOString() },
      });
    } catch (err) {
      console.error('Audit logging failed:', err);
      // Don't throw - audit failures shouldn't block main operations
    }
  };

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, []);

  return {
    notes,
    loading,
    error,
    loadNotes,
    createNote,
    updateNote,
    deleteNote,
  };
}