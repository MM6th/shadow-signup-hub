
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
      
      // Insert the appointment into the database
      const { data: appointmentData, error: appointmentError } = await supabaseAdmin
        .from('appointments')
        .insert({
          product_id: appointment.productId,
          product_title: appointment.productTitle,
          seller_id: appointment.sellerId,
          buyer_id: appointment.buyerId,
          buyer_name: appointment.buyerName,
          appointment_date: appointment.appointmentDate,
          appointment_time: appointment.appointmentTime,
          status: 'scheduled'
        })
        .select()
        .single();
      
      if (appointmentError) {
        console.error("Error creating appointment:", appointmentError);
        return new Response(
          JSON.stringify({ 
            error: appointmentError.message || "Failed to create appointment" 
          }),
          { 
            status: 400, 
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders 
            } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          message: "Appointment created successfully",
          appointmentId: appointmentData.id
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
      const { userId, isSeller } = await req.json();
      
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
      
      // Fetch appointments from the database
      const { data: appointmentsData, error: appointmentsError } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .or(isSeller ? `seller_id.eq.${userId}` : `buyer_id.eq.${userId}`)
        .order('appointment_date', { ascending: true });
      
      if (appointmentsError) {
        console.error("Error fetching appointments:", appointmentsError);
        return new Response(
          JSON.stringify({ 
            error: appointmentsError.message || "Failed to fetch appointments" 
          }),
          { 
            status: 400, 
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders 
            } 
          }
        );
      }
      
      // Transform data format for the frontend
      const appointments = appointmentsData.map(apt => ({
        id: apt.id,
        productTitle: apt.product_title,
        customerName: apt.buyer_name,
        appointmentDate: apt.appointment_date,
        appointmentTime: apt.appointment_time,
        status: apt.status
      }));
      
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
