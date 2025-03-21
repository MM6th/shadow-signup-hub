
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { name, params } = await req.json();

    let result = null;
    let error = null;

    if (name === "get_or_create_stream_session") {
      const { session_id, user_id } = params;
      
      // First check if session exists
      const { data: existingSession, error: getError } = await supabaseClient
        .from("stream_sessions")
        .select("*")
        .eq("id", session_id)
        .single();
      
      if (getError && getError.code !== "PGRST116") {
        // Error other than "not found"
        error = getError;
      } else if (!existingSession) {
        // Create new session
        const { data: newSession, error: insertError } = await supabaseClient
          .from("stream_sessions")
          .insert({
            id: session_id,
            host_id: user_id,
            offer_candidates: [],
            answer_candidates: []
          })
          .select()
          .single();
        
        result = newSession;
        error = insertError;
      } else {
        result = existingSession;
      }
    } else if (name === "get_stream_session") {
      const { session_id } = params;
      
      const { data, error: getError } = await supabaseClient
        .from("stream_sessions")
        .select("*")
        .eq("id", session_id)
        .single();
      
      result = data;
      error = getError;
    } else if (name === "update_session_offer") {
      const { session_id, offer_data } = params;
      
      const { data, error: updateError } = await supabaseClient
        .from("stream_sessions")
        .update({ offer: offer_data })
        .eq("id", session_id)
        .select()
        .single();
      
      result = data;
      error = updateError;
    } else if (name === "update_session_answer") {
      const { session_id, answer_data } = params;
      
      const { data, error: updateError } = await supabaseClient
        .from("stream_sessions")
        .update({ answer: answer_data })
        .eq("id", session_id)
        .select()
        .single();
      
      result = data;
      error = updateError;
    } else if (name === "append_offer_candidate") {
      const { session_id, candidate } = params;
      
      // Get current candidates
      const { data: session } = await supabaseClient
        .from("stream_sessions")
        .select("offer_candidates")
        .eq("id", session_id)
        .single();
      
      const candidates = session?.offer_candidates || [];
      candidates.push(JSON.parse(candidate));
      
      // Update with new candidates
      const { data, error: updateError } = await supabaseClient
        .from("stream_sessions")
        .update({ offer_candidates: candidates })
        .eq("id", session_id)
        .select()
        .single();
      
      result = data;
      error = updateError;
    } else if (name === "append_answer_candidate") {
      const { session_id, candidate } = params;
      
      // Get current candidates
      const { data: session } = await supabaseClient
        .from("stream_sessions")
        .select("answer_candidates")
        .eq("id", session_id)
        .single();
      
      const candidates = session?.answer_candidates || [];
      candidates.push(JSON.parse(candidate));
      
      // Update with new candidates
      const { data, error: updateError } = await supabaseClient
        .from("stream_sessions")
        .update({ answer_candidates: candidates })
        .eq("id", session_id)
        .select()
        .single();
      
      result = data;
      error = updateError;
    }

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
