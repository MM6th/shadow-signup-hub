
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PaymentDialog from "./PaymentDialog";
import AppointmentDialog from "./AppointmentDialog";
import { useWalletAddresses } from "@/hooks/useWalletAddresses";

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
  
  const ADMIN_EMAIL = "cmooregee@gmail.com";
  const isOwner = user?.id === product.user_id;
  const isService = product.type === 'service';
  const isAdminUser = user?.email === ADMIN_EMAIL;

  const { adminWalletAddresses } = useWalletAddresses(user, product.id, isAdminUser);

  const handleEdit = () => {
    navigate(`/edit-product/${product.id}`);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleBuyButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the card click event from triggering
    
    if (isService && user) {
      setIsSchedulerOpen(true);
    } else {
      setIsPaymentDialogOpen(true);
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
          <p className="text-lg font-bold mb-4">${product.price.toFixed(2)}</p>
          {isOwner && (showEditButton !== false) ? (
            <Button onClick={handleEdit} className="w-full">
              Edit
            </Button>
          ) : (
            <Button onClick={handleBuyButtonClick} className="w-full">
              {isService ? "Schedule Appointment" : "Buy Now"}
            </Button>
          )}
        </div>
      </CardContent>

      <PaymentDialog 
        open={isPaymentDialogOpen} 
        onOpenChange={setIsPaymentDialogOpen}
        product={product}
        adminWalletAddresses={adminWalletAddresses}
        isAdminUser={isAdminUser}
      />

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
