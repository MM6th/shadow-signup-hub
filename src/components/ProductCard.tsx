
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    description: string;
    price: number;
    image_url: string | null;
    user_id: string;
    category?: string; // Make category optional
  };
  onClick?: () => void; // Make onClick optional
  showEditButton?: boolean; // Make showEditButton optional
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, showEditButton }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const isOwner = user?.id === product.user_id;

  // Reset QR code when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setQrCode(null);
      setBuyerEmail("");
    }
  }, [isDialogOpen]);

  const handleEdit = () => {
    navigate(`/edit-product/${product.id}`);
  };

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

  const handleBuyNow = async () => {
    try {
      setIsLoading(true);
      
      // Get the wallet address for this product
      const { data: walletData, error: walletError } = await supabase
        .from('wallet_addresses')
        .select('*')
        .eq('product_id', product.id)
        .single();

      if (walletError) {
        throw walletError;
      }

      if (!walletData) {
        throw new Error('No wallet address found for this product');
      }

      // Generate QR code for the wallet address
      const qrCodeUrl = await generateQRCode(walletData.wallet_address);
      setQrCode(qrCodeUrl);

      // Send purchase confirmation email
      const { error: emailError } = await supabase.functions.invoke('send-purchase-confirmation', {
        body: {
          email: buyerEmail,
          productTitle: product.title,
          productPrice: product.price,
          walletAddress: walletData.wallet_address,
          cryptoType: walletData.crypto_type
        },
      });

      if (emailError) {
        throw emailError;
      }

      toast({
        title: "Purchase initiated!",
        description: "Check your email for payment instructions.",
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

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Card className="overflow-hidden h-[500px] flex flex-col" onClick={handleCardClick}>
      <div className="relative h-64 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            No Image
          </div>
        )}
      </div>
      
      <CardContent className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
        <p className="text-gray-600 mb-4 flex-grow overflow-y-auto">
          {product.description}
        </p>
        <div className="mt-auto">
          <p className="text-lg font-bold mb-4">${product.price.toFixed(2)}</p>
          {isOwner && (showEditButton !== false) ? (
            <Button onClick={handleEdit} className="w-full">
              Edit
            </Button>
          ) : (
            <Button onClick={() => setIsDialogOpen(true)} className="w-full">
              Buy Now
            </Button>
          )}
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
            <DialogDescription>
              Please enter your email address to receive payment instructions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
            />
            
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="Payment QR Code" className="max-w-full" />
              </div>
            )}
            
            <Button 
              onClick={handleBuyNow} 
              className="w-full"
              disabled={!buyerEmail || isLoading}
            >
              {isLoading ? "Processing..." : "Confirm Purchase"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProductCard;
