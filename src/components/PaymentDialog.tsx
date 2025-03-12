
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
          <DialogDescription>
            Click the button below to copy the payment address to your clipboard
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
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
            {isLoading ? "Processing..." : "Copy Payment Address"}
          </Button>
          
          {!walletData && (
            <p className="text-center text-destructive text-sm">
              No payment options available. Please contact the administrator.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
