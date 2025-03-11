
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppointmentRequest {
  productId: string;
  productTitle: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  appointmentDate: string;
  appointmentTime: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    if (req.method === "POST") {
      // Create a new appointment
      const appointment: AppointmentRequest = await req.json();
      
      console.log("Creating appointment:", appointment);
      
      // In a real application, this would create a new appointment in the database
      // and handle notifications to the seller
      console.log(`Appointment scheduled for product "${appointment.productTitle}"`);
      console.log(`Date: ${appointment.appointmentDate} at ${appointment.appointmentTime}`);
      console.log(`Buyer: ${appointment.buyerName} (${appointment.buyerId})`);
      console.log(`Seller: ${appointment.sellerId}`);
      
      // For demo purposes, we're just returning success
      return new Response(
        JSON.stringify({ 
          message: "Appointment created successfully",
          appointmentId: crypto.randomUUID()
        }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    } else if (req.method === "GET") {
      // Get appointments for a user
      const url = new URL(req.url);
      const userId = url.searchParams.get("userId");
      const isSeller = url.searchParams.get("isSeller") === "true";
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Missing userId parameter" }),
          { 
            status: 400, 
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders 
            } 
          }
        );
      }
      
      console.log(`Fetching appointments for user ${userId} (${isSeller ? "seller" : "buyer"})`);
      
      // In a real application, this would fetch appointments from the database
      // For demo purposes, we'll return some sample data
      const appointments = [
        {
          id: crypto.randomUUID(),
          productTitle: "Tarot Reading Session",
          customerName: "Jane Smith",
          appointmentDate: new Date().toISOString(),
          appointmentTime: "10:00 AM",
          status: "scheduled"
        },
        {
          id: crypto.randomUUID(),
          productTitle: "Astrology Consultation",
          customerName: "John Doe",
          appointmentDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          appointmentTime: "02:00 PM",
          status: "scheduled"
        }
      ];
      
      return new Response(
        JSON.stringify({ appointments }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
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
