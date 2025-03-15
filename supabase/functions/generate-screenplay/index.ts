
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock generator function that creates a plausible-looking screenplay response
function generateMockScreenplay(projectName: string, characterDescription?: string, bookText?: string) {
  console.log("Generating mock screenplay content for:", projectName);
  
  // Extract character name from description or create a default
  let characterName = "Alex";
  if (characterDescription && characterDescription.includes("name")) {
    const nameMatch = characterDescription.match(/name(?:\s+is)?\s+([A-Za-z]+)/i);
    if (nameMatch && nameMatch[1]) {
      characterName = nameMatch[1];
    }
  }
  
  // Create a basic setting from project name
  const settings = ["modern-day city", "small coastal town", "futuristic metropolis", "rural countryside"];
  const randomSetting = settings[Math.floor(Math.random() * settings.length)];
  
  // Generate the mock screenplay content as structured JSON
  return {
    character_profile: {
      name: characterName,
      background: `${characterName} grew up in a ${randomSetting}, always dreaming of more. Their journey began when an unexpected event changed everything.`,
      personality: "Determined, resourceful, and compassionate, with a sharp wit and occasional stubbornness.",
      physical_attributes: "Medium height with distinctive features that reflect their background and experiences."
    },
    screenplay_outline: {
      title: projectName,
      logline: `In a ${randomSetting}, ${characterName} must overcome personal demons and external challenges to achieve an impossible goal.`,
      setting: `The story takes place in a ${randomSetting}, with elements that reflect the main character's journey.`,
      characters: [
        {
          name: characterName,
          role: "Protagonist",
          description: characterDescription || `The main character who drives the story forward through their actions and decisions.`
        },
        {
          name: "Morgan",
          role: "Mentor/Ally",
          description: "Guides the protagonist through challenging situations with wisdom and experience."
        },
        {
          name: "Taylor",
          role: "Antagonist",
          description: "Creates obstacles for the protagonist, representing opposing values or goals."
        }
      ],
      plot_points: [
        "Inciting Incident: An unexpected event disrupts the protagonist's normal life.",
        "First Challenge: The protagonist faces their first major obstacle.",
        "Midpoint Crisis: Everything changes as new information comes to light.",
        "Lowest Point: The protagonist experiences a significant setback.",
        "Climactic Confrontation: The final challenge that tests everything the protagonist has learned.",
        "Resolution: The aftermath of the conflict and its impact on the characters."
      ]
    },
    sample_scene: {
      scene_title: "The Decision",
      setting: `Interior - ${characterName}'s apartment - Night`,
      description: "The room is dimly lit, with rain pattering against the windows. Personal items reveal aspects of the protagonist's character.",
      dialogue: [
        {
          character: characterName,
          line: "I can't keep running from this. Not anymore."
        },
        {
          character: "Morgan",
          line: "You know what you're up against. They won't make it easy."
        },
        {
          character: characterName,
          line: "Nothing worth doing ever is. But this... this is something I have to face."
        },
        {
          character: "Morgan",
          line: "Then I'll be there with you. Every step of the way."
        },
        {
          character: characterName,
          line: "No. This is something I need to do alone."
        }
      ]
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Generate screenplay function called");
    
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
    
    console.log("Processing request for project:", projectName);
    console.log("Character description:", characterDescription ? "Provided" : "Not provided");
    console.log("Book text:", bookText ? `Provided (${bookText.length} chars)` : "Not provided");
    console.log("Image URLs:", imageUrls ? `${imageUrls.length} images provided` : "No images");
    
    // Generate mock content instead of calling OpenAI API
    try {
      console.log("Generating mock screenplay content...");
      const screenplayData = generateMockScreenplay(projectName, characterDescription, bookText);
      
      console.log("Mock screenplay generated successfully");
      
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
      
    } catch (generateError) {
      console.error("Error generating mock screenplay:", generateError);
      throw generateError;
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
