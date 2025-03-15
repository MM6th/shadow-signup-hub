
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
    console.log("Generate screenplay function called");
    
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      throw new Error("API configuration error: OpenAI API key is missing");
    }
    
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body parsed successfully:", Object.keys(requestBody));
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      throw new Error("Invalid request format");
    }
    
    const { projectName, characterDescription, bookText, imageUrls } = requestBody;
    
    if (!projectName) {
      console.error("Missing required field: projectName");
      throw new Error("Missing required field: projectName");
    }
    
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
    
    console.log("Sending request to OpenAI with prompt length:", userPrompt.length);
    
    // Call OpenAI API for content generation
    let openAIResponse;
    try {
      console.log("Calling OpenAI API...");
      openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
          response_format: { type: "json_object" }
        }),
      });
      
      // First check if the response is OK
      if (!openAIResponse.ok) {
        // Try to get the text of the error first
        let errorText;
        try {
          const contentType = openAIResponse.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await openAIResponse.json();
            console.error("OpenAI API error (JSON):", errorData);
            errorText = errorData.error?.message || JSON.stringify(errorData);
          } else {
            errorText = await openAIResponse.text();
            console.error("OpenAI API error (text):", errorText);
            
            // Check if it's an HTML response (likely from a proxy/CDN)
            if (errorText.includes("<!DOCTYPE html>")) {
              errorText = "Received HTML instead of JSON. Possible network or API configuration issue.";
            }
          }
        } catch (textError) {
          console.error("Error parsing error response:", textError);
          errorText = "Unknown error format from OpenAI API";
        }
        
        throw new Error(`OpenAI API error (${openAIResponse.status}): ${errorText}`);
      }
      
      // Now safely try to parse the successful JSON response
      let data;
      try {
        data = await openAIResponse.json();
        console.log("Received valid JSON response from OpenAI");
      } catch (jsonError) {
        // Handle case where response looks OK but isn't valid JSON
        const rawText = await openAIResponse.text();
        console.error("Failed to parse OpenAI response as JSON:", jsonError);
        console.error("Raw response:", rawText.substring(0, 500) + "...");
        
        if (rawText.includes("<!DOCTYPE html>")) {
          throw new Error("Received HTML instead of JSON from OpenAI API. Check your network configuration.");
        } else {
          throw new Error(`Invalid JSON response from OpenAI: ${jsonError.message}`);
        }
      }
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('Failed to generate screenplay content: No choices returned');
      }
      
      const generatedContent = data.choices[0].message.content;
      console.log("Generated content length:", generatedContent.length);
      
      // Try to parse the JSON response
      let screenplayData;
      try {
        // Since we specified response_format as json_object, we should get valid JSON
        screenplayData = JSON.parse(generatedContent);
        console.log("Successfully parsed JSON response");
      } catch (parseError) {
        console.error('Error parsing JSON from AI response:', parseError);
        console.error('Raw content excerpt:', generatedContent.substring(0, 500) + "...");
        
        // If JSON parsing fails, try to extract JSON from markdown code blocks
        try {
          const jsonMatch = generatedContent.match(/```json\n([\s\S]*?)\n```/) || 
                          generatedContent.match(/```\n([\s\S]*?)\n```/);
          
          if (jsonMatch && jsonMatch[1]) {
            screenplayData = JSON.parse(jsonMatch[1]);
            console.log("Successfully extracted and parsed JSON from code block");
          } else {
            // If still can't parse, return the raw text
            screenplayData = { rawContent: generatedContent };
          }
        } catch (extractError) {
          console.error('Failed to extract JSON from code blocks:', extractError);
          screenplayData = { rawContent: generatedContent };
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        data: screenplayData 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } catch (openAIError) {
      console.error("Error calling OpenAI API:", openAIError);
      throw openAIError;
    }
    
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
