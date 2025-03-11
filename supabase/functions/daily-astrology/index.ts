
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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

    // Check if OpenAI API key is available
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      throw new Error('OpenAI API key is not configured');
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

    console.log('Sending request to OpenAI with prompt:', prompt);

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
    
    console.log('Generated message:', message);

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
