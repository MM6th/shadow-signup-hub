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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log that we're starting to process a request
    console.log("Processing purchase confirmation request (email functionality removed)");
    
    const { productTitle, productPrice, walletAddress, cryptoType }: PurchaseConfirmationRequest = await req.json();

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

    console.log("Purchase recorded successfully (no email sent)");
    
    return new Response(
      JSON.stringify({ 
        message: "Purchase recorded successfully (email functionality removed)",
        purchaseDetails: {
          product: productTitle,
          price: productPrice,
          cryptoType,
          date: purchaseDate
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
