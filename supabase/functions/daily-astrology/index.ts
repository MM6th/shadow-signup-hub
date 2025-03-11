
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://uhqeuhysxkzptbvxgnvt.supabase.co';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocWV1aHlzeGt6cHRidnhnbnZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MTU3NTQsImV4cCI6MjA1NzI5MTc1NH0.G0z9wnB5jk7Axk4uwTowLRrWw50v1BkL-7443hKr5Q8';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user ID and zodiac sign from request
    const { userId, zodiacSign, firstName } = await req.json();

    if (!userId || !zodiacSign) {
      throw new Error('User ID and zodiac sign are required');
    }

    // Get current date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Generate astrological message using OpenAI
    const prompt = `
      Today is ${formattedDate}. Create a brief, personalized daily astrological message for ${firstName || 'a person'} 
      whose zodiac sign is ${zodiacSign}. Include:
      1. A warm, personalized greeting
      2. A brief (2-3 sentences) description of what the day might hold based on planetary positions
      3. A short piece of advice or suggestion based on their sign
      Keep it positive, inspiring and under 150 words. Format it nicely with paragraphs.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an astrological assistant that provides daily insights based on zodiac signs and planetary positions. Your tone is warm, positive, and insightful.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error('Failed to generate message');
    }

    const data = await response.json();
    const message = data.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
