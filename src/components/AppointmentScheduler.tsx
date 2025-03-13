
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface AppointmentSchedulerProps {
  onScheduleSelected?: (date: Date, timeSlot: string) => void;
  productId?: string;
  productTitle?: string;
  sellerId?: string;
  onSchedulingComplete?: () => void;
}

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({ 
  onScheduleSelected, 
  productId, 
  productTitle, 
  sellerId, 
  onSchedulingComplete 
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null); // Reset time slot when date changes
  };

  const handleTimeSelect = async (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    
    if (selectedDate) {
      // Call the callback if provided (for backward compatibility)
      if (onScheduleSelected) {
        onScheduleSelected(selectedDate, timeSlot);
      }
      
      // If we have product info, handle the appointment creation
      if (productId && sellerId && user && productTitle) {
        try {
          setIsSubmitting(true);
          
          const appointmentData = {
            product_id: productId,
            product_title: productTitle,
            seller_id: sellerId,
            buyer_id: user.id,
            buyer_name: user.user_metadata?.full_name || user.email,
            appointment_date: format(selectedDate, 'yyyy-MM-dd'),
            appointment_time: timeSlot,
            status: 'scheduled'
          };
          
          const { data, error } = await supabase
            .from('appointments')
            .insert(appointmentData)
            .select()
            .single();
            
          if (error) throw error;
          
          toast({
            title: "Appointment Scheduled",
            description: "Your appointment has been successfully scheduled.",
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
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  // Disable past dates and weekends
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (date < today) return true;
    
    // Disable dates more than 30 days in the future
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30);
    if (date > maxDate) return true;
    
    return false;
  };

  return (
    <div className="space-y-4 glass-card p-4">
      <h3 className="text-lg font-medium">Schedule Your Consultation</h3>
      <p className="text-sm text-pi-muted">Please select a date and time for your virtual consultation</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-2">Select Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div>
          <label className="text-sm font-medium block mb-2">Select Time</label>
          <div className="space-y-2">
            {selectedDate ? (
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((timeSlot) => (
                  <Button
                    key={timeSlot}
                    variant={selectedTimeSlot === timeSlot ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "w-full",
                      selectedTimeSlot === timeSlot && "bg-pi-focus text-white"
                    )}
                    onClick={() => handleTimeSelect(timeSlot)}
                    disabled={isSubmitting}
                  >
                    <Clock className="mr-1 h-3 w-3" /> {timeSlot}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-pi-muted">Please select a date first</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentScheduler;
