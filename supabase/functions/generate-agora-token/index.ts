
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Agora token generation
// This is a placeholder implementation, you'll need a proper Agora token generation library
function generateAgoraToken(channelName: string, uid: string, role: string, expirationTimeInSeconds: number) {
  // In a real implementation, you would use the Agora token generator SDK
  // For now, we'll return a mock token
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
