
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Video, Calendar, Clock, Star, DollarSign, Wallet } from 'lucide-react';
import AppointmentDialog from "./AppointmentDialog";
import PaymentDialog from "./PaymentDialog";
import { useWalletAddresses } from "@/hooks/useWalletAddresses";

interface VideoConsultationCardProps {
  product: {
    id: string;
    title: string;
    description: string;
    price: number;
    image_url: string | null;
    user_id: string;
    enable_free_consultation?: boolean;
    enable_paypal?: boolean;
    enable_crypto?: boolean;
    paypal_client_id?: string;
  };
  onClick?: () => void;
  showEditButton?: boolean;
}

const VideoConsultationCard: React.FC<VideoConsultationCardProps> = ({ 
  product, 
  onClick, 
  showEditButton 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isFreeConsultation, setIsFreeConsultation] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  // Get payment methods data
  const { adminWalletAddresses, hasPayPalEnabled, paypalClientId, isLoading } = useWalletAddresses(
    user, 
    product.id, 
    false
  );
  
  const selectedWalletAddress = adminWalletAddresses.length > 0 ? adminWalletAddresses[0] : null;
  const hasPaymentMethods = adminWalletAddresses.length > 0 || hasPayPalEnabled;
  const hasCryptoEnabled = product.enable_crypto && adminWalletAddresses.length > 0;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/edit-product/${product.id}`);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleSchedulingComplete = () => {
    setIsSchedulerOpen(false);
    toast({
      title: "Appointment Scheduled",
      description: "Your appointment has been successfully scheduled. Check your dashboard for details.",
    });
  };

  const handleRequestFreeConsultation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFreeConsultation(true);
    setIsSchedulerOpen(true);
  };

  const handleBookPaidSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isLoading) {
      toast({
        title: "Loading payment options",
        description: "Please wait while we fetch payment information",
      });
      return;
    }
    
    if (!hasPaymentMethods) {
      toast({
        title: "No Payment Methods",
        description: "No payment options are available for this consultation.",
        variant: "destructive",
      });
      return;
    }
    
    setIsFreeConsultation(false);
    setIsSchedulerOpen(true);
  };

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
            <Video className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-primary/80 text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
          Video Consultation
        </div>
      </div>
      
      <CardContent className="p-4 flex flex-col flex-grow" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
        <p className="text-gray-600 mb-4 flex-grow overflow-y-auto">
          {product.description}
        </p>
        
        <div className="mt-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-muted-foreground text-sm">
              <Clock size={16} />
              <span>60 min</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star size={16} className="text-yellow-500" />
              <span className="text-sm font-medium">New</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 text-xs">
            {hasPayPalEnabled && (
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                PayPal
              </div>
            )}
            
            {hasCryptoEnabled && (
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                <span className="flex items-center">
                  <Wallet size={12} className="mr-1" />
                  Crypto
                </span>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <DollarSign size={16} className="text-green-500" />
              <p className="text-lg font-bold">
                ${product.price.toFixed(2)}/hr
              </p>
            </div>
          </div>
          
          {user?.id === product.user_id || showEditButton ? (
            <Button onClick={handleEdit} className="w-full">
              Edit
            </Button>
          ) : (
            <div className="space-y-2">
              <Button onClick={handleBookPaidSession} className="w-full">
                Book Paid Session
              </Button>
              
              {product.enable_free_consultation && (
                <Button 
                  variant="outline" 
                  onClick={handleRequestFreeConsultation} 
                  className="w-full"
                >
                  Request Free Consultation
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
        isFreeConsultation={isFreeConsultation}
        productPrice={product.price}
      />

      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        product={{
          id: product.id,
          title: product.title,
          price: product.price,
          enable_paypal: hasPayPalEnabled,
          paypal_client_id: paypalClientId || undefined
        }}
        walletData={selectedWalletAddress}
      />
    </Card>
  );
};

export default VideoConsultationCard;
