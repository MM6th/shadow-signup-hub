
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Agora token generation
// This is a placeholder implementation that should be replaced with the actual Agora token generator
function generateAgoraToken(channelName: string, uid: string, role: string, expirationTimeInSeconds: number) {
  // In a production environment, you should use the Agora token generator SDK
  // and your actual Agora App ID and App Certificate
  // const appID = Deno.env.get("AGORA_APP_ID") || "";
  // const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE") || "";
  
  // For now, return a mock token to enable development
  return `mock-agora-token-${channelName}-${uid}-${Date.now()}`;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenRequest {
  channelName: string;
  uid: string; 
  role?: string;
  expirationTimeInSeconds?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with Deno fetch
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get user ID from JWT token
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { channelName, uid, role = 'publisher', expirationTimeInSeconds = 3600 }: TokenRequest = await req.json();
    
    if (!channelName) {
      throw new Error('Channel name is required');
    }

    if (!uid) {
      throw new Error('User ID is required');
    }

    // Generate the token
    const token = generateAgoraToken(channelName, uid, role, expirationTimeInSeconds);

    return new Response(
      JSON.stringify({ 
        token,
        channelName,
        uid,
        expirationTimeInSeconds 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  } catch (error: any) {
    console.error('Error generating Agora token:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate token' }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
};

serve(handler);

// Missing createClient function that was needed
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
