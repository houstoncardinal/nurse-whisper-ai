import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIGenerationResult {
  success: boolean;
  content: Record<string, string>;
  template: string;
  error?: string;
}

export function useAI() {
  const generateNote = async (
    transcript: string,
    template: string
  ): Promise<AIGenerationResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-note', {
        body: {
          transcript,
          template,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'AI generation failed');
      }

      return {
        success: true,
        content: data.content,
        template: data.template,
      };
    } catch (error: any) {
      console.error('AI generation error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        toast.error('Rate limit exceeded', {
          description: 'Please wait a moment before trying again',
        });
      } else if (error.message?.includes('402') || error.message?.includes('credits')) {
        toast.error('AI credits depleted', {
          description: 'Please add credits to your workspace',
        });
      } else {
        toast.error('AI generation failed', {
          description: error.message || 'Please try again',
        });
      }

      return {
        success: false,
        content: {},
        template,
        error: error.message,
      };
    }
  };

  return {
    generateNote,
  };
}