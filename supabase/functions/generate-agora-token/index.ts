
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { RtcTokenBuilder, RtcRole } from "https://esm.sh/agora-token@2.0.3";

const AGORA_APP_ID = "0763309372ab4637918e71cb13f52323";
// In a production environment, this would be a secret
const AGORA_APP_CERTIFICATE = ""; // You should add this as a secret in Supabase

function generateAgoraToken(channelName: string, uid: string, role: string, expirationTimeInSeconds: number) {
  // For now using a placeholder token to enable development
  // This should be replaced with actual Agora token generation in production
  const appID = AGORA_APP_ID;
  const appCertificate = AGORA_APP_CERTIFICATE;
  
  if (!appCertificate) {
    console.log("WARNING: Using mock token as App Certificate is not set");
    return `mock-agora-token-${channelName}-${uid}-${Date.now()}`;
  }
  
  try {
    // Use the Agora Token Builder
    const tokenExpirationInSeconds = expirationTimeInSeconds;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + tokenExpirationInSeconds;
    
    // Build the token
    let rtcToken;
    if (role === 'publisher') {
      rtcToken = RtcTokenBuilder.buildTokenWithUid(
        appID,
        appCertificate,
        channelName,
        parseInt(uid),
        RtcRole.PUBLISHER,
        privilegeExpiredTs
      );
    } else {
      rtcToken = RtcTokenBuilder.buildTokenWithUid(
        appID,
        appCertificate,
        channelName,
        parseInt(uid),
        RtcRole.SUBSCRIBER,
        privilegeExpiredTs
      );
    }
    
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

    if (!token) {
      throw new Error('Failed to generate token');
    }

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
