
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
  productPrice?: number;
}

export const AppointmentDialog: React.FC<AppointmentDialogProps> = ({
  open,
  onOpenChange,
  productId,
  productTitle,
  sellerId,
  onSchedulingComplete,
  user,
  isFreeConsultation = false,
  productPrice = 0
}) => {
  const { toast } = useToast();
  const [enableNotifications, setEnableNotifications] = useState(true);

  const handleScheduleAppointment = async (date: Date, timeSlot: string, timeZone: string) => {
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
            time_zone: timeZone,
            status: 'scheduled',
            is_free_consultation: isFreeConsultation,
            enable_notifications: enableNotifications,
            hourly_rate: isFreeConsultation ? 0 : productPrice
          }
        ])
        .select();

      if (error) throw error;

      // Send email notification (this would call the edge function)
      try {
        await supabase.functions.invoke('send-purchase-confirmation', {
          body: {
            productTitle,
            appointmentDate: formattedDate,
            appointmentTime: timeSlot,
            timeZone,
            buyerName: user.user_metadata?.full_name || user.email,
            buyerId: user.id,
            sellerId,
            productId,
            isAdminUser: false
          },
        });
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Continue even if email fails
      }

      toast({
        title: "Appointment Scheduled",
        description: `Your appointment has been scheduled for ${formattedDate} at ${timeSlot} in your local time zone.`,
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
              hourlyRate={isFreeConsultation ? 0 : productPrice}
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
