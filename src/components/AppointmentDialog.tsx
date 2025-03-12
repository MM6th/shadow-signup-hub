
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AppointmentScheduler from "./AppointmentScheduler";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productTitle: string;
  sellerId: string;
  onSchedulingComplete: () => void;
  user: any;
}

const AppointmentDialog: React.FC<AppointmentDialogProps> = ({
  open,
  onOpenChange,
  productId,
  productTitle,
  sellerId,
  onSchedulingComplete,
  user
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            Choose a date and time for your virtual consultation
          </DialogDescription>
        </DialogHeader>
        
        {user && (
          <AppointmentScheduler
            productId={productId}
            productTitle={productTitle}
            sellerId={sellerId}
            onSchedulingComplete={onSchedulingComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;
