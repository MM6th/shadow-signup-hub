
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { CreditCard, Copy, QrCode } from 'lucide-react';
import PayPalButton from './PayPalButton';

interface Product {
  id: string;
  title: string;
  price: number;
  enable_paypal?: boolean;
  paypal_client_id?: string;
  contact_phone?: string;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  walletData?: any;
  onSuccess?: (details: any) => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({ 
  open, 
  onOpenChange, 
  product,
  walletData,
  onSuccess
}) => {
  const { toast } = useToast();
  const [showQr, setShowQr] = useState(false);
  
  const handleCopyWallet = async () => {
    if (!walletData) {
      toast({
        title: "No wallet available",
        description: "Sorry, no cryptocurrency wallet is available for this product."
      });
      return;
    }
    
    try {
      await navigator.clipboard.writeText(walletData.wallet_address);
      toast({
        title: "Address copied!",
        description: `Send ${product.price} ${walletData.crypto_type.toUpperCase()} to complete your purchase.`
      });
    } catch (error) {
      console.error('Error copying address:', error);
      toast({
        title: "Error",
        description: "Failed to copy wallet address",
        variant: "destructive"
      });
    }
  };
  
  const handlePayPalSuccess = (details: any) => {
    toast({
      title: "Payment successful!",
      description: `Transaction completed. Thank you for your purchase!`
    });
    
    // Close the dialog
    onOpenChange(false);
    
    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess(details);
    }
  };
  
  const generateQRCode = (walletAddress: string) => {
    if (!walletAddress) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(walletAddress)}`;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Options</DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium">{product.title}</h3>
              <p className="text-2xl font-bold mt-2">${product.price}</p>
            </div>
            
            {product.enable_paypal && product.paypal_client_id && (
              <div className="border p-4 rounded-lg space-y-4">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  <h4 className="font-medium">Pay with PayPal</h4>
                </div>
                
                <PayPalButton
                  productId={product.id}
                  amount={product.price}
                  onSuccess={handlePayPalSuccess}
                  clientId={product.paypal_client_id}
                />
              </div>
            )}
            
            {walletData && (
              <div className="border p-4 rounded-lg space-y-4">
                <div className="flex items-center">
                  <h4 className="font-medium">Pay with {walletData.crypto_type.toUpperCase()}</h4>
                </div>
                
                {showQr ? (
                  <div className="flex justify-center">
                    <img 
                      src={generateQRCode(walletData.wallet_address)} 
                      alt="QR Code" 
                      className="h-48 w-48"
                    />
                  </div>
                ) : (
                  <div className="flex justify-center gap-2">
                    <Button onClick={handleCopyWallet} className="w-full" size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Address
                    </Button>
                    <Button onClick={() => setShowQr(true)} variant="outline" size="sm">
                      <QrCode className="h-4 w-4 mr-2" />
                      Show QR
                    </Button>
                  </div>
                )}
                
                {showQr && (
                  <Button onClick={() => setShowQr(false)} variant="outline" size="sm" className="w-full">
                    Hide QR
                  </Button>
                )}
                
                {product.contact_phone && (
                  <div className="text-sm text-center mt-2 text-gray-500">
                    Contact seller at {product.contact_phone} after payment
                  </div>
                )}
              </div>
            )}
            
            {!product.enable_paypal && !walletData && (
              <div className="text-center py-4 text-gray-500">
                No payment methods available for this product.
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
