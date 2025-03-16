import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseConfirmationRequest {
  productTitle: string;
  productPrice?: number;
  walletAddress?: string;
  cryptoType?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  timeZone?: string;
  buyerName?: string;
  sellerId?: string;
  productId?: string;
  buyerId?: string;
  isAdminUser?: boolean;
  contactPhone?: string;
}

// Admin email to check against
const ADMIN_EMAIL = "cmooregee@gmail.com";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log that we're starting to process a request
    console.log("Processing purchase confirmation request");
    
    const { 
      productTitle, 
      productPrice, 
      walletAddress, 
      cryptoType,
      appointmentDate,
      appointmentTime,
      timeZone,
      buyerName,
      sellerId,
      productId,
      buyerId,
      isAdminUser,
      contactPhone
    }: PurchaseConfirmationRequest = await req.json();

    console.log(`Request data received: product=${productTitle}, type=${appointmentDate ? 'appointment' : 'purchase'}`);

    // Create Supabase client with Deno fetch (for email sending later)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Format the date for record keeping
    const purchaseDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Check if this is a non-admin user
    if (!isAdminUser) {
      console.log("Non-admin user purchase - using admin wallet address");
      // For non-admin users, we're already receiving the admin's wallet address
      // from the client side, so we continue with the purchase
    } else {
      console.log("Admin user purchase - using specified wallet address");
      // For the admin user, we use their specified wallet address
    }

    // If this is a consultation purchase with appointment data, log it
    if (appointmentDate && appointmentTime) {
      console.log(`Appointment scheduled for ${appointmentDate} at ${appointmentTime} in ${timeZone}`);

      // Here we would add code to send email notifications
      try {
        // In a real implementation, you would send an email to the buyer and the seller
        console.log(`Would send emails to buyer (${buyerId}) and seller (${sellerId})`);
        
        // Get seller's email from profiles table
        const { data: sellerData, error: sellerError } = await supabaseClient
          .from('profiles')
          .select('email')
          .eq('id', sellerId)
          .single();
        
        if (sellerError) {
          console.error("Error getting seller information:", sellerError);
        } else if (sellerData) {
          console.log(`Would send email to seller at ${sellerData.email}`);
        }
        
        // Email logic would go here
        // In future implementations, use a service like Resend to send emails
      } catch (emailError) {
        console.error("Error sending email notifications:", emailError);
      }
    }

    console.log("Purchase/appointment recorded successfully");
    
    return new Response(
      JSON.stringify({ 
        message: "Purchase recorded successfully",
        purchaseDetails: {
          product: productTitle,
          price: productPrice,
          cryptoType,
          date: purchaseDate,
          appointmentDate,
          appointmentTime,
          timeZone
        }
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
    console.error("Error in send-purchase-confirmation function:", error);
    
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
