
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PaymentDialog from "./PaymentDialog";
import AppointmentDialog from "./AppointmentDialog";
import { useWalletAddresses } from "@/hooks/useWalletAddresses";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QrCode, Copy, Phone } from 'lucide-react';

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
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  
  const ADMIN_EMAIL = "cmooregee@gmail.com";
  const isAdminUser = user?.email === ADMIN_EMAIL;
  const isService = product.type === 'service';

  const { adminWalletAddresses } = useWalletAddresses(user, product.id, isAdminUser);

  const selectedWalletAddress = adminWalletAddresses.length > 0 ? adminWalletAddresses[0] : null;

  const handleEdit = () => {
    navigate(`/edit-product/${product.id}`);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const generateQRCode = (walletAddress: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${walletAddress}`;
  };

  const handleCopyWallet = async () => {
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
          <p className="text-lg font-bold mb-4">${product.price.toFixed(2)}{product.type !== 'tangible' ? '/hr' : ''}</p>
          
          {isAdminUser && (showEditButton !== false) ? (
            <Button onClick={handleEdit} className="w-full">
              Edit
            </Button>
          ) : isService ? (
            <Button onClick={() => setIsSchedulerOpen(true)} className="w-full">
              Schedule Appointment
            </Button>
          ) : (
            <div className="space-y-2">
              {selectedWalletAddress ? (
                <>
                  <Button onClick={handleCopyWallet} className="w-full">
                    <Copy size={16} className="mr-2" /> Copy Payment Address
                  </Button>
                  
                  <div className="flex justify-between">
                    <Popover open={showQRCode} onOpenChange={setShowQRCode}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <QrCode size={16} className="mr-2" /> Show QR
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="bg-white p-2 w-auto">
                        <img 
                          src={generateQRCode(selectedWalletAddress.wallet_address)} 
                          alt="QR Code" 
                          className="h-32 w-32"
                        />
                      </PopoverContent>
                    </Popover>
                    
                    {product.contact_phone && (
                      <Button variant="outline" size="sm" onClick={() => {
                        toast({
                          title: "Seller Contact",
                          description: `Contact the seller at: ${product.contact_phone}`,
                        });
                      }}>
                        <Phone size={16} className="mr-2" /> Contact
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <Button disabled className="w-full">
                  No Payment Option Available
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
    </Card>
  );
};

export default ProductCard;
