
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
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

    // Extract parameters from request
    const { userId, isSeller } = await req.json();
    
    if (userId !== user.id) {
      throw new Error("Unauthorized access");
    }

    let query;
    
    // Fetch appointments based on role
    if (isSeller) {
      query = supabaseClient
        .from('appointments')
        .select('*')
        .eq('seller_id', userId)
        .order('appointment_date', { ascending: true });
    } else {
      query = supabaseClient
        .from('appointments')
        .select('*')
        .eq('buyer_id', userId)
        .order('appointment_date', { ascending: true });
    }

    const { data: appointments, error } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        appointments
      }),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error("Error in appointments function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unexpected error occurred",
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        }
      }
    );
  }
});
