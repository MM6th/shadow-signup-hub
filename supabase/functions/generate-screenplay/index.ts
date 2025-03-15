
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { OpenAI } from "https://esm.sh/openai@4.12.4"

console.log("Generate Screenplay Edge Function Initialized")

// Define CORS headers directly instead of importing
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the session to verify authentication
    const {
      data: { session },
    } = await supabaseClient.auth.getSession()

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Extract the request payload
    const { characterName, characterDescription, bookText, images } = await req.json()

    // Initialize OpenAI client - check for both environment variable formats
    const apiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('OPEN_API_KEY');
    
    if (!apiKey) {
      console.error("OpenAI API key not found in environment variables");
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured properly' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    console.log("Generating screenplay content with OpenAI...")
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional screenplay writer. Create a detailed character profile, screenplay outline, and sample scene based on the provided character and context information."
          },
          {
            role: "user",
            content: `Create a screenplay based on this character: ${characterName} - ${characterDescription}. ${bookText ? `Include this context: ${bookText}` : ''}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      });

      const generatedContent = completion.choices[0].message.content;
      console.log("OpenAI content generated successfully");
    
      // Parse and structure the generated content
      // This is a simplified parsing approach - in production you'd want more robust parsing
      const sections = generatedContent.split("\n\n");
      
      // Create structured screenplay content
      const screenplayContent = {
        character_profile: {
          name: characterName,
          background: extractSection(generatedContent, "Background"),
          personality: extractSection(generatedContent, "Personality"),
          physical_attributes: extractSection(generatedContent, "Physical Attributes")
        },
        screenplay_outline: {
          title: extractSection(generatedContent, "Title") || "Untitled Screenplay",
          logline: extractSection(generatedContent, "Logline"),
          setting: extractSection(generatedContent, "Setting"),
          characters: parseCharacters(generatedContent),
          plot_points: parsePlotPoints(generatedContent)
        },
        sample_scene: {
          scene_title: extractSection(generatedContent, "Scene"),
          setting: extractSection(generatedContent, "Scene Setting"),
          description: extractSection(generatedContent, "Description"),
          dialogue: parseDialogue(generatedContent)
        }
      };

      // Insert the data into Supabase
      const { data, error } = await supabaseClient
        .from('screenplay_projects')
        .insert({
          user_id: session.user.id,
          name: `${characterName}'s Story`,
          character_description: characterDescription,
          book_text: bookText || null,
          images: images || [],
          ai_generated_content: screenplayContent
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      console.log("Screenplay saved to database");
      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (openAiError) {
      console.error("OpenAI API error:", openAiError);
      
      // Fallback to mock data if OpenAI fails
      console.log("Falling back to mock data generation");
      return generateMockResponse(supabaseClient, session, characterName, characterDescription, bookText, images, corsHeaders);
    }
  } catch (error) {
    console.error("Error in generate-screenplay function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Helper function to generate mock response as fallback
async function generateMockResponse(supabaseClient, session, characterName, characterDescription, bookText, images, corsHeaders) {
  console.log("Generating mock screenplay content...")
  
  // Create a mock screenplay content similar to what we'd get from OpenAI
  const mockScreenplayContent = {
    character_profile: {
      name: characterName,
      background: "Born into a family of scholars, they developed a keen intellect and curiosity about the world from an early age.",
      personality: "Analytical, introspective, and determined. They possess a sharp wit and an unwavering sense of justice.",
      physical_attributes: "Medium height with an athletic build. They have expressive eyes that reveal their emotions despite attempts to hide them."
    },
    screenplay_outline: {
      title: `The Journey of ${characterName}`,
      logline: `After discovering a hidden truth about their past, ${characterName} embarks on a dangerous quest that will challenge everything they thought they knew about the world.`,
      setting: "A blend of futuristic metropolis and untamed wilderness in a world where technology and nature exist in precarious balance.",
      characters: [
        {
          name: characterName,
          role: "Protagonist",
          description: characterDescription || "A brilliant but troubled individual searching for answers about their mysterious past."
        },
        {
          name: "Elara",
          role: "Ally",
          description: "A skilled navigator with secret knowledge of the forbidden zones."
        },
        {
          name: "Director Voss",
          role: "Antagonist",
          description: "The calculating leader of the Institute who will stop at nothing to maintain order and control."
        }
      ],
      plot_points: [
        `${characterName} discovers inconsistencies in their personal records while working at the Archives.`,
        "An encounter with a mysterious stranger leaves them with a cryptic message and a strange artifact.",
        "When their investigation draws unwanted attention, they're forced to flee the city with the help of Elara.",
        "The journey through the wilderness reveals incredible abilities they never knew they possessed.",
        "A confrontation with Director Voss reveals shocking truths about their origin and the real purpose of the Institute.",
        "The final decision: use their newfound knowledge to bring down the corrupt system or accept a comfortable lie."
      ]
    },
    sample_scene: {
      scene_title: "The Archives",
      setting: "INT. CENTRAL ARCHIVES - NIGHT",
      description: "Dim blue light bathes rows of holographic data terminals. The room is empty except for a single figure hunched over a terminal, their face illuminated by the screen's glow.",
      dialogue: [
        {
          character: characterName,
          line: "That's impossible. These records can't both be correct."
        },
        {
          character: "SYSTEM VOICE",
          line: "Access to restricted files detected. Security alert in progress."
        },
        {
          character: characterName,
          line: "No, no, no. Override code Theta-Nine-Three!"
        },
        {
          character: "ELARA",
          line: "That won't work. We need to leave. Now."
        }
      ]
    }
  };

  // Insert the mock data into Supabase
  const { data, error } = await supabaseClient
    .from('screenplay_projects')
    .insert({
      user_id: session.user.id,
      name: `${characterName}'s Story`,
      character_description: characterDescription,
      book_text: bookText || null,
      images: images || [],
      ai_generated_content: mockScreenplayContent
    })
    .select()
    .single();

  if (error) {
    console.error("Database error:", error);
    throw error;
  }

  console.log("Mock screenplay saved to database");
  return new Response(
    JSON.stringify({ success: true, data, note: "Generated with mock data (OpenAI fallback)" }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Helper functions to parse the generated content
function extractSection(text, sectionName) {
  const regex = new RegExp(`${sectionName}[:\\s]+(.*?)(?=\\n\\n|$)`, 'is');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function parseCharacters(text) {
  const charactersSection = extractSection(text, "Characters");
  if (!charactersSection) return [];
  
  const characters = [];
  const characterEntries = charactersSection.split('\n');
  
  for (const entry of characterEntries) {
    const match = entry.match(/^([^:]+):?\s*(.+)$/);
    if (match) {
      const [_, name, description] = match;
      let role = "Supporting";
      
      if (description.toLowerCase().includes("protagonist") || 
          description.toLowerCase().includes("main character")) {
        role = "Protagonist";
      } else if (description.toLowerCase().includes("antagonist") || 
                description.toLowerCase().includes("villain")) {
        role = "Antagonist";
      } else if (description.toLowerCase().includes("ally") || 
                description.toLowerCase().includes("sidekick")) {
        role = "Ally";
      }
      
      characters.push({ name: name.trim(), role, description: description.trim() });
    }
  }
  
  return characters.length > 0 ? characters : [
    { name: "Character Name", role: "Protagonist", description: "Main character description" },
    { name: "Supporting Character", role: "Supporting", description: "A supporting character" }
  ];
}

function parsePlotPoints(text) {
  const plotSection = extractSection(text, "Plot Points") || extractSection(text, "Plot");
  if (!plotSection) return ["Beginning of the story", "Middle conflict", "Climax", "Resolution"];
  
  return plotSection.split('\n')
    .map(point => point.replace(/^-\s*/, '').trim())
    .filter(point => point.length > 0);
}

function parseDialogue(text) {
  const dialogueSection = extractSection(text, "Dialogue");
  if (!dialogueSection) return [
    { character: "CHARACTER NAME", line: "Example dialogue line" },
    { character: "OTHER CHARACTER", line: "Response dialogue" }
  ];
  
  const dialogue = [];
  const lines = dialogueSection.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const characterMatch = lines[i].match(/^([A-Z][A-Z\s]+)(?:\s*\(.*\))?:?\s*$/);
    if (characterMatch && i + 1 < lines.length) {
      const character = characterMatch[1].trim();
      let line = lines[i + 1].trim();
      
      // Remove quotes if present
      line = line.replace(/^["'](.*)["']$/, '$1');
      
      dialogue.push({ character, line });
      i++; // Skip the next line as we've already processed it
    }
  }
  
  return dialogue.length > 0 ? dialogue : [
    { character: "CHARACTER", line: "Example dialogue" },
    { character: "ANOTHER CHARACTER", line: "Response dialogue" }
  ];
}
