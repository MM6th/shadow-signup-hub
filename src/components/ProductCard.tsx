
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AppointmentDialog from "./AppointmentDialog";
import { useWalletAddresses } from "@/hooks/useWalletAddresses";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QrCode, Copy, Phone, Star } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import ReviewDialog from "./ReviewDialog";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    description: string;
    price: number;
    image_url: string | null;
    user_id: string;
    category?: string; 
    type?: string;
    contact_phone?: string;
  };
  onClick?: () => void;
  showEditButton?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, showEditButton }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  
  const ADMIN_EMAIL = "cmooregee@gmail.com";
  const isAdminUser = user?.email === ADMIN_EMAIL;
  const isService = product.type === 'service';

  const { adminWalletAddresses } = useWalletAddresses(user, product.id, isAdminUser);

  const selectedWalletAddress = adminWalletAddresses.length > 0 ? adminWalletAddresses[0] : null;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/edit-product/${product.id}`);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const generateQRCode = (walletAddress: string) => {
    if (!walletAddress) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(walletAddress)}`;
  };

  const handleCopyWallet = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!selectedWalletAddress) {
      toast({
        title: "Error",
        description: "No payment options available. Please contact the administrator.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Copy wallet address to clipboard
      await navigator.clipboard.writeText(selectedWalletAddress.wallet_address);
      
      // Record the purchase
      await supabase.functions.invoke('send-purchase-confirmation', {
        body: {
          productTitle: product.title,
          productPrice: product.price,
          walletAddress: selectedWalletAddress.wallet_address,
          cryptoType: selectedWalletAddress.crypto_type,
          contactPhone: product.contact_phone || "Not provided"
        },
      });

      toast({
        title: "Payment address copied!",
        description: `Send ${product.price} ${selectedWalletAddress.crypto_type} to the copied address to complete your purchase. Contact the seller at ${product.contact_phone || "unknown"} after payment.`,
      });
    } catch (error) {
      console.error('Error processing:', error);
      toast({
        title: "Error",
        description: "Failed to copy payment address",
        variant: "destructive",
      });
    }
  };

  const handleSchedulingComplete = () => {
    setIsSchedulerOpen(false);
    toast({
      title: "Appointment Scheduled",
      description: "Your appointment has been successfully scheduled. Check your dashboard for details.",
    });
  };

  const handleOpenReviewDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to leave a review.",
        variant: "destructive",
      });
      return;
    }
    setIsReviewDialogOpen(true);
  };

  const handleScheduleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSchedulerOpen(true);
  };
  
  const handleShowQR = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowQRCode(!showQRCode);
  };
  
  const handleContactSeller = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.contact_phone) {
      toast({
        title: "Seller Contact",
        description: `Contact the seller at: ${product.contact_phone}`,
      });
    } else {
      toast({
        title: "Contact Information Unavailable",
        description: "No contact information provided for this seller.",
        variant: "destructive",
      });
    }
  };

  const qrCodeUrl = selectedWalletAddress ? generateQRCode(selectedWalletAddress.wallet_address) : '';

  return (
    <Card 
      className="overflow-hidden h-[500px] flex flex-col"
      onClick={handleCardClick}
    >
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
      
      <CardContent className="p-4 flex flex-col flex-grow" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
        <p className="text-gray-600 mb-4 flex-grow overflow-y-auto">
          {product.description}
        </p>
        <div className="mt-auto">
          <p className="text-lg font-bold mb-4">${product.price.toFixed(2)}{product.type !== 'tangible' ? '/hr' : ''}</p>
          
          {isAdminUser && (showEditButton !== false) ? (
            <Button onClick={handleEdit} className="w-full">
              Edit
            </Button>
          ) : isService ? (
            <Button onClick={handleScheduleClick} className="w-full">
              Schedule Appointment
            </Button>
          ) : (
            <div className="space-y-2">
              <Button onClick={handleCopyWallet} className="w-full">
                <Copy size={16} className="mr-2" /> Buy Now
              </Button>
              
              <div className="flex justify-between">
                <Popover open={showQRCode} onOpenChange={setShowQRCode}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleShowQR}>
                      <QrCode size={16} className="mr-2" /> Show QR
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-white p-2 w-auto">
                    {qrCodeUrl ? (
                      <img 
                        src={qrCodeUrl} 
                        alt="QR Code" 
                        className="h-32 w-32"
                      />
                    ) : (
                      <div className="h-32 w-32 flex items-center justify-center text-sm text-gray-500">
                        No wallet address available
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
                
                <Button variant="outline" size="sm" onClick={handleOpenReviewDialog}>
                  <Star size={16} className="mr-2" /> Review
                </Button>
              </div>

              {product.contact_phone && (
                <Button variant="outline" size="sm" onClick={handleContactSeller} className="w-full">
                  <Phone size={16} className="mr-2" /> Contact Seller
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <AppointmentDialog
        open={isSchedulerOpen}
        onOpenChange={setIsSchedulerOpen}
        productId={product.id}
        productTitle={product.title}
        sellerId={product.user_id}
        onSchedulingComplete={handleSchedulingComplete}
        user={user}
      />

      <ReviewDialog
        open={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
        productId={product.id}
        sellerId={product.user_id}
        user={user}
      />
    </Card>
  );
};

export default ProductCard;
