
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseConfirmationRequest {
  email: string;
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
    console.log("Processing purchase confirmation request");
    
    // Check if API key is available
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set");
      throw new Error("Email service configuration is missing");
    }

    console.log("API Key present:", resendApiKey ? "Yes (length: " + resendApiKey.length + ")" : "No");

    const { email, productTitle, productPrice, walletAddress, cryptoType }: PurchaseConfirmationRequest = await req.json();

    console.log(`Request data received: email=${email}, product=${productTitle}, crypto=${cryptoType}`);

    if (!email || !productTitle || !walletAddress || !cryptoType) {
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

    // Format the date for the email
    const purchaseDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    console.log("Generating email with Resend");
    
    try {
      // Create a purchase receipt email
      const { data, error } = await resend.emails.send({
        from: "Cosmic Marketplace <onboarding@resend.dev>",
        to: [email],
        subject: `Your Purchase: ${productTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6b46c1; text-align: center; font-size: 28px;">Thank You For Your Purchase!</h1>
            
            <div style="background-color: #f9f4ff; border-radius: 10px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #6b46c1; margin-top: 0;">Purchase Details</h2>
              <p><strong>Product:</strong> ${productTitle}</p>
              <p><strong>Price:</strong> $${productPrice.toFixed(2)}</p>
              <p><strong>Date:</strong> ${purchaseDate}</p>
            </div>
            
            <div style="background-color: #f4f7ff; border-radius: 10px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #3b82f6; margin-top: 0;">Payment Information</h2>
              <p>Please complete your purchase by sending payment to the following ${cryptoType} address:</p>
              <p style="background-color: #e2e8f0; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all;">${walletAddress}</p>
              <p>After sending the payment, please keep the transaction ID for your records.</p>
            </div>
            
            <div style="margin: 30px 0; text-align: center;">
              <p>After completing your payment, the seller will be notified, and you'll receive access to your purchase.</p>
              <p>If you have any questions, please reply to this email.</p>
            </div>
            
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096;">
              <p>&copy; ${new Date().getFullYear()} Cosmic Marketplace. All rights reserved.</p>
            </div>
          </div>
        `,
      });

      console.log("Resend API response:", JSON.stringify(data || error, null, 2));

      if (error) {
        console.error("Email error:", error);
        throw new Error(error.message || "Unknown error sending email");
      }

      console.log("Email sent successfully:", data);

      return new Response(
        JSON.stringify({ message: "Purchase confirmation sent successfully", data }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    } catch (emailError) {
      console.error("Resend API error:", emailError);
      throw new Error(`Email service error: ${emailError.message}`);
    }
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
