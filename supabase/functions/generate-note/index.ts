import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, template } = await req.json();

    if (!transcript || !template) {
      throw new Error('Missing required fields: transcript and template');
    }

    console.log(`Generating ${template} note from transcript...`);

    // Initialize Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build system prompt based on template
    const systemPrompts: Record<string, string> = {
      'SOAP': `You are an Epic-compliant clinical documentation assistant. Convert dictated notes into a properly formatted SOAP note.

SOAP Format:
- Subjective: Patient's reported symptoms, concerns, and history
- Objective: Measurable observations, vital signs, exam findings
- Assessment: Clinical interpretation and diagnosis
- Plan: Treatment plan, interventions, follow-up

Include vital signs, pain assessments, I&O when applicable, safety checks. Use professional clinical language.`,
      
      'SBAR': `You are an Epic-compliant clinical documentation assistant. Convert dictated notes into a properly formatted SBAR handoff note.

SBAR Format:
- Situation: Current patient status and immediate concern (include vital signs, pain level)
- Background: Relevant history, medications, allergies, recent procedures
- Assessment: Clinical evaluation and findings (nursing assessment, trends, concerns)
- Recommendation: Suggested actions and interventions (specific orders needed)

Include patient identification, current vital signs, I&O balance, pain status, active orders, pending results.`,
      
      'PIE': `You are an Epic-compliant clinical documentation assistant. Convert dictated notes into a properly formatted PIE note.

PIE Format:
- Problem: Identified patient problem or nursing diagnosis (use NANDA-approved diagnoses)
- Intervention: Nursing actions taken (specific, measurable interventions with time)
- Evaluation: Patient's response to interventions and outcomes (measurable results)

Link to active nursing diagnoses, include specific interventions with time/dose/route, document patient education.`,
      
      'DAR': `You are an Epic-compliant clinical documentation assistant. Convert dictated notes into a properly formatted DAR note.

DAR Format:
- Data: Subjective and objective information about the patient
- Action: Nursing interventions and actions taken
- Response: Patient's response to the actions and current status

Use professional clinical language and include measurable outcomes.`
    };

    const systemPrompt = systemPrompts[template] || systemPrompts['SOAP'];

    const userPrompt = `Convert this clinical dictation into an Epic-compliant ${template} note:

${transcript}

Return ONLY a valid JSON object with section keys matching the template format. For SOAP: {"subjective": "...", "objective": "...", "assessment": "...", "plan": "..."}. No markdown, no code blocks, no extra text.`;

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error('AI generation failed');
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    // Parse the AI response
    let noteContent: Record<string, string> = {};
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        noteContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw response:', generatedText);
      
      // Fallback: create structured content from text
      const sections = template === 'SOAP' 
        ? ['subjective', 'objective', 'assessment', 'plan']
        : template === 'SBAR'
        ? ['situation', 'background', 'assessment', 'recommendation']
        : template === 'PIE'
        ? ['problem', 'intervention', 'evaluation']
        : ['data', 'action', 'response'];
      
      noteContent = {};
      sections.forEach(section => {
        noteContent[section] = generatedText;
      });
    }

    // Log successful generation
    console.log(`Successfully generated ${template} note`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: noteContent,
        template
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-note function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});