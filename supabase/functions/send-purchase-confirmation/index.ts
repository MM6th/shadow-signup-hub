
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseConfirmationRequest {
  productTitle: string;
  productPrice: number;
  walletAddress: string;
  cryptoType: string;
  appointmentDate?: string;
  appointmentTime?: string;
  buyerName?: string;
  sellerId?: string;
  productId?: string;
  buyerId?: string;
  isAdminUser?: boolean; // Flag to identify if this is the admin user
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
      buyerName,
      sellerId,
      productId,
      buyerId,
      isAdminUser
    }: PurchaseConfirmationRequest = await req.json();

    console.log(`Request data received: product=${productTitle}, crypto=${cryptoType}`);

    if (!productTitle || !walletAddress || !cryptoType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

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
      console.log(`Appointment scheduled for ${appointmentDate} at ${appointmentTime}`);
      
      // In a real implementation, this would store the appointment in a database
      // For demo purposes, we'll just log it
      console.log(`Appointment details - Buyer: ${buyerName}, Seller: ${sellerId}, Product: ${productId}`);
    }

    console.log("Purchase recorded successfully");
    
    return new Response(
      JSON.stringify({ 
        message: "Purchase recorded successfully",
        purchaseDetails: {
          product: productTitle,
          price: productPrice,
          cryptoType,
          date: purchaseDate,
          appointmentDate,
          appointmentTime
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
