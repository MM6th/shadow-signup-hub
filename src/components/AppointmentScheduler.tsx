
import React, { useState } from 'react';
import { format, parse, isValid } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  onSchedulingComplete 
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dateInputValue, setDateInputValue] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setDateInputValue(format(date, 'yyyy-MM-dd'));
    }
    setSelectedTimeSlot(null); // Reset time slot when date changes
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateInputValue(value);
    
    // Try to parse the date
    const parsedDate = parse(value, 'yyyy-MM-dd', new Date());
    if (isValid(parsedDate)) {
      setSelectedDate(parsedDate);
    }
  };

  const handleTimeSelect = async (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setIsSubmitting(true);
    
    try {
      if (selectedDate && onScheduleSelected) {
        onScheduleSelected(selectedDate, timeSlot);
        
        toast({
          title: "Appointment Scheduled",
          description: "Your appointment has been successfully scheduled.",
        });
        
        if (onSchedulingComplete) {
          onSchedulingComplete();
        }
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
          <div className="flex space-x-2">
            <Input
              type="date"
              value={dateInputValue}
              onChange={handleDateInputChange}
              className="w-full"
              placeholder="YYYY-MM-DD"
            />
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  className="px-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    handleDateSelect(date);
                    setCalendarOpen(false);
                  }}
                  disabled={isDateDisabled}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
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
