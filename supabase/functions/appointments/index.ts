
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
    const message = "The appointments feature has been permanently removed";
    console.log(message);
    
    return new Response(
      JSON.stringify({ 
        message,
        status: "removed" 
      }),
      { 
        status: 410, // Gone - This resource is no longer available
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
        error: "Service permanently removed",
      }),
      { 
        status: 410, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        }
      }
    );
  }
});
