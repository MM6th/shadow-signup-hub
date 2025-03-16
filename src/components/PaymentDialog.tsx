
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PayPalButton from './PayPalButton';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    title: string;
    price: number;
  };
  walletData: {
    wallet_address: string;
    crypto_type: string;
  } | null;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onOpenChange,
  product,
  walletData
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const { toast } = useToast();
  
  // PayPal client ID
  const PAYPAL_CLIENT_ID = "YOUR_PAYPAL_CLIENT_ID"; // Replace with your actual client ID

  const generateQRCode = async (walletAddress: string) => {
    try {
      const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${walletAddress}`);
      if (response.ok) {
        return response.url;
      }
      throw new Error('Failed to generate QR code');
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };

  const handleCopyAddress = async () => {
    if (!walletData) {
      toast({
        title: "Error",
        description: "No payment address available. Please contact the administrator.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Generate QR code for the wallet address if not already generated
      if (!qrCode) {
        const qrCodeUrl = await generateQRCode(walletData.wallet_address);
        setQrCode(qrCodeUrl);
      }

      // Copy wallet address to clipboard
      navigator.clipboard.writeText(walletData.wallet_address);

      // Record the purchase
      await supabase.functions.invoke('send-purchase-confirmation', {
        body: {
          productTitle: product.title,
          productPrice: product.price,
          walletAddress: walletData.wallet_address,
          cryptoType: walletData.crypto_type
        },
      });

      toast({
        title: "Address copied!",
        description: `Send ${product.price} ${walletData.crypto_type} to the copied address to complete your purchase.`,
      });

    } catch (error: any) {
      console.error('Error processing purchase:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process purchase",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayPalSuccess = async (details: any) => {
    try {
      // Record the purchase
      await supabase.functions.invoke('send-purchase-confirmation', {
        body: {
          productTitle: product.title,
          productPrice: product.price,
          paymentMethod: 'paypal',
          paypalDetails: {
            transactionId: details.id,
            payerEmail: details.payer.email_address,
            status: details.status
          }
        },
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error recording PayPal purchase:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to record purchase",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
          <DialogDescription>
            Choose your preferred payment method to complete the purchase
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="crypto" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="crypto">Cryptocurrency</TabsTrigger>
            <TabsTrigger value="paypal">PayPal</TabsTrigger>
          </TabsList>
          
          <TabsContent value="crypto" className="space-y-4">
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="Payment QR Code" className="max-w-full" />
              </div>
            )}
            
            <Button 
              onClick={handleCopyAddress} 
              className="w-full"
              disabled={isLoading || !walletData}
            >
              {isLoading ? "Processing..." : "Copy Crypto Address"}
            </Button>
            
            {!walletData && (
              <p className="text-center text-destructive text-sm">
                No cryptocurrency payment options available. Please contact the administrator or try PayPal.
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="paypal" className="space-y-4">
            <div className="rounded-md bg-muted p-4 mb-4">
              <p className="text-sm text-center">
                Pay securely with PayPal - Amount: ${product.price.toFixed(2)} USD
              </p>
            </div>
            
            <PayPalButton 
              productId={product.id}
              amount={product.price}
              onSuccess={handlePayPalSuccess}
              clientId={PAYPAL_CLIENT_ID}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
