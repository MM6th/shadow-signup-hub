
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { RtcTokenBuilder, RtcRole } from "https://esm.sh/agora-token@2.0.3";

const AGORA_APP_ID = "0763309372ab4637918e71cb13f52323";

function generateAgoraToken(channelName: string, uid: string, role: string, expirationTimeInSeconds: number, appCertificate: string) {
  try {
    console.log(`Generating token for channel: ${channelName}, uid: ${uid}, role: ${role}`);
    
    // Use the Agora Token Builder
    const tokenExpirationInSeconds = expirationTimeInSeconds;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + tokenExpirationInSeconds;
    
    // Parse the uid as an integer
    const uidInt = parseInt(uid, 10);
    
    if (isNaN(uidInt)) {
      console.error("Invalid UID format, must be a number:", uid);
      throw new Error("Invalid UID format");
    }
    
    // Build the token
    let rtcToken;
    if (role === 'publisher') {
      rtcToken = RtcTokenBuilder.buildTokenWithUid(
        AGORA_APP_ID,
        appCertificate,
        channelName,
        uidInt,
        RtcRole.PUBLISHER,
        privilegeExpiredTs
      );
    } else {
      rtcToken = RtcTokenBuilder.buildTokenWithUid(
        AGORA_APP_ID,
        appCertificate,
        channelName,
        uidInt,
        RtcRole.SUBSCRIBER,
        privilegeExpiredTs
      );
    }
    
    console.log("Token generated successfully");
    return rtcToken;
  } catch (error) {
    console.error("Error generating Agora token:", error);
    return null;
  }
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
    console.log("Received request to generate-agora-token function");
    
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
      console.error("User not authenticated");
      throw new Error("User not authenticated");
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (err) {
      console.error("Failed to parse request body:", err);
      throw new Error("Invalid request body");
    }

    const { channelName, uid, role = 'publisher', expirationTimeInSeconds = 3600 }: TokenRequest = requestBody;
    
    console.log("Request params:", { channelName, uid, role, expirationTimeInSeconds });
    
    if (!channelName) {
      throw new Error('Channel name is required');
    }

    if (!uid) {
      throw new Error('User ID is required');
    }

    // Get the App Certificate from environment variables/secrets
    const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");
    
    if (!appCertificate) {
      console.error("AGORA_APP_CERTIFICATE not found in environment");
      throw new Error('Agora App Certificate is not configured in Edge Function secrets');
    }

    // Generate the token
    const token = generateAgoraToken(channelName, uid, role, expirationTimeInSeconds, appCertificate);

    if (!token) {
      throw new Error('Failed to generate token');
    }

    const responseBody = { 
      token,
      channelName,
      uid,
      expirationTimeInSeconds 
    };
    
    console.log("Successfully generated token, returning response");
    
    return new Response(
      JSON.stringify(responseBody),
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
