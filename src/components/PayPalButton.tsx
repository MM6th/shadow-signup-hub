
import React, { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PayPalButtonProps {
  productId: string;
  amount: number;
  onSuccess: (details: any) => void;
  clientId: string;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

const PayPalButton: React.FC<PayPalButtonProps> = ({ productId, amount, onSuccess, clientId }) => {
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Add PayPal Script to the document
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.async = true;
    
    script.onload = () => {
      if (window.paypal && paypalButtonRef.current) {
        // Clear the container first
        paypalButtonRef.current.innerHTML = '';
        
        // Render the PayPal button
        window.paypal.Buttons({
          createOrder: (_: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                reference_id: productId,
                description: 'Product purchase',
                amount: {
                  currency_code: 'USD',
                  value: amount.toString()
                }
              }]
            });
          },
          onApprove: async (_: any, actions: any) => {
            try {
              const details = await actions.order.capture();
              onSuccess(details);
              toast({
                title: "Payment successful!",
                description: `Transaction completed by ${details.payer.name.given_name}`,
              });
              return details;
            } catch (error) {
              console.error('Payment error:', error);
              toast({
                title: "Payment failed",
                description: error instanceof Error ? error.message : "An error occurred during payment processing",
                variant: "destructive",
              });
            }
          },
          onError: (err: any) => {
            console.error('PayPal error:', err);
            toast({
              title: "PayPal Error",
              description: "There was an error processing your payment",
              variant: "destructive",
            });
          }
        }).render(paypalButtonRef.current);
      }
    };
    
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [amount, productId, onSuccess, clientId, toast]);
  
  return <div ref={paypalButtonRef} className="paypal-button-container mt-2" />;
};

export default PayPalButton;
