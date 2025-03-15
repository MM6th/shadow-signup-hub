
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectName, characterDescription, bookText, imageUrls } = await req.json();
    
    // Craft the appropriate prompt based on available inputs
    let systemPrompt = "You are an expert screenplay writer and character developer.";
    let userPrompt = `Create a detailed character profile and screenplay outline for a project titled "${projectName}".`;
    
    if (characterDescription) {
      userPrompt += `\n\nCharacter description provided by user: ${characterDescription}`;
    }
    
    if (imageUrls && imageUrls.length > 0) {
      userPrompt += `\n\nThe user has uploaded ${imageUrls.length} photos of the character.`;
      // Include the actual image URLs in the prompt
      userPrompt += `\n\nImage URLs: ${imageUrls.join(', ')}`;
    }
    
    if (bookText) {
      userPrompt += `\n\nAdapt the following book text into a screenplay format:\n${bookText.substring(0, 3000)}`;
      // Limiting to 3000 chars to avoid token limits
    }
    
    userPrompt += `\n\nPlease provide the following in JSON format:
    1. Character profile (name, background, personality, physical attributes)
    2. Screenplay outline (title, logline, setting, characters, plot points)
    3. Sample scene dialogue
    `;
    
    console.log("Sending request to OpenAI with prompt:", userPrompt.substring(0, 100) + "...");
    
    // Call OpenAI API for content generation
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });
    
    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await openAIResponse.json();
    console.log("Received response from OpenAI:", data);
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('Failed to generate screenplay content');
    }
    
    const generatedContent = data.choices[0].message.content;
    
    // Try to parse the JSON response
    let screenplayData;
    try {
      // Extract JSON from the response if it's wrapped in markdown code blocks
      const jsonMatch = generatedContent.match(/```json\n([\s\S]*?)\n```/) || 
                        generatedContent.match(/```\n([\s\S]*?)\n```/) ||
                        [null, generatedContent];
      
      screenplayData = JSON.parse(jsonMatch[1] || generatedContent);
    } catch (parseError) {
      console.error('Error parsing JSON from AI response:', parseError);
      // If JSON parsing fails, return the raw text
      screenplayData = { rawContent: generatedContent };
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: screenplayData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in generate-screenplay function:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
