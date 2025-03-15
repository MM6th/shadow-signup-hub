
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
    try {
      console.log("Calling OpenAI API...");
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
          response_format: { type: "json_object" }
        }),
      });
      
      // Check if the response is OK
      if (!openAIResponse.ok) {
        const contentType = openAIResponse.headers.get("content-type");
        let errorText = "";
        
        try {
          if (contentType && contentType.includes("application/json")) {
            const errorData = await openAIResponse.json();
            console.error("OpenAI API error (JSON):", errorData);
            errorText = errorData.error?.message || JSON.stringify(errorData);
          } else {
            errorText = await openAIResponse.text();
            console.error("OpenAI API error (text):", errorText.substring(0, 500));
            
            if (errorText.includes("<!DOCTYPE html>")) {
              errorText = "OpenAI API returned HTML instead of JSON. Possible network or configuration issue.";
            }
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
          errorText = "Unknown error from OpenAI API";
        }
        
        throw new Error(`OpenAI API error (${openAIResponse.status}): ${errorText}`);
      }
      
      // Verify the content type before attempting to parse JSON
      const contentType = openAIResponse.headers.get("content-type");
      console.log("OpenAI response content type:", contentType);
      
      if (!contentType || !contentType.includes("application/json")) {
        // Handle non-JSON response by returning a more informative error
        const rawText = await openAIResponse.text();
        console.error("OpenAI returned non-JSON response:", rawText.substring(0, 500));
        throw new Error("OpenAI API returned non-JSON response. Contact support with error code: CONTENT_TYPE_ERROR");
      }
      
      // Parse the JSON response
      const data = await openAIResponse.json();
      console.log("OpenAI response parsed successfully");
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('Failed to generate screenplay content: No choices returned');
      }
      
      const generatedContent = data.choices[0].message.content;
      console.log("Generated content length:", generatedContent.length);
      
      // Try to parse the JSON response from OpenAI
      let screenplayData;
      try {
        screenplayData = JSON.parse(generatedContent);
        console.log("Successfully parsed JSON from AI response");
      } catch (parseError) {
        console.error('Error parsing JSON from AI response:', parseError);
        console.error('Raw content excerpt:', generatedContent.substring(0, 500));
        
        // If JSON parsing fails, try to extract JSON from markdown code blocks
        try {
          const jsonMatch = generatedContent.match(/```json\n([\s\S]*?)\n```/) || 
                          generatedContent.match(/```\n([\s\S]*?)\n```/);
          
          if (jsonMatch && jsonMatch[1]) {
            screenplayData = JSON.parse(jsonMatch[1]);
            console.log("Successfully extracted and parsed JSON from code block");
          } else {
            // If still can't parse, return the raw text but in a valid JSON format
            screenplayData = { 
              error: "Parsing error", 
              rawContent: generatedContent.substring(0, 1000) + "..." 
            };
          }
        } catch (extractError) {
          console.error('Failed to extract JSON from code blocks:', extractError);
          screenplayData = { 
            error: "Multiple parsing errors", 
            rawContent: generatedContent.substring(0, 1000) + "..." 
          };
        }
      }
      
      // Return a properly formatted JSON response
      return new Response(JSON.stringify({ 
        success: true, 
        data: screenplayData 
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      });
      
    } catch (openAIError) {
      console.error("Error calling OpenAI API:", openAIError);
      throw openAIError;
    }
    
  } catch (error) {
    console.error('Error in generate-screenplay function:', error);
    
    // Ensure we always return a valid JSON response even for errors
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Unknown error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
