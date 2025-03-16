
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AppointmentScheduler from "./AppointmentScheduler";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productTitle: string;
  sellerId: string;
  onSchedulingComplete: () => void;
  user: any;
  isFreeConsultation?: boolean;
}

const AppointmentDialog: React.FC<AppointmentDialogProps> = ({
  open,
  onOpenChange,
  productId,
  productTitle,
  sellerId,
  onSchedulingComplete,
  user,
  isFreeConsultation = false
}) => {
  const { toast } = useToast();
  const [enableNotifications, setEnableNotifications] = useState(true);

  const handleScheduleAppointment = async (date: Date, timeSlot: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to schedule an appointment.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format date as ISO string
      const formattedDate = date.toISOString().split('T')[0];
      
      // Create appointment record
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            product_id: productId,
            product_title: productTitle,
            seller_id: sellerId,
            buyer_id: user.id,
            buyer_name: user.user_metadata?.full_name || user.email,
            appointment_date: formattedDate,
            appointment_time: timeSlot,
            status: 'scheduled',
            is_free_consultation: isFreeConsultation,
            enable_notifications: enableNotifications
          }
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Appointment Scheduled",
        description: `Your appointment has been scheduled for ${formattedDate} at ${timeSlot}.`,
      });

      if (onSchedulingComplete) {
        onSchedulingComplete();
      }
    } catch (error: any) {
      console.error('Error scheduling appointment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to schedule appointment",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            Choose a date and time for your {isFreeConsultation ? "free consultation" : "virtual consultation"}
          </DialogDescription>
        </DialogHeader>
        
        {user && (
          <>
            <AppointmentScheduler
              productId={productId}
              productTitle={productTitle}
              sellerId={sellerId}
              onScheduleSelected={handleScheduleAppointment}
            />
            
            <div className="flex items-center space-x-2 mt-4">
              <Switch
                id="enable-notifications"
                checked={enableNotifications}
                onCheckedChange={setEnableNotifications}
              />
              <Label htmlFor="enable-notifications">
                Receive email reminders for this appointment
              </Label>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;
