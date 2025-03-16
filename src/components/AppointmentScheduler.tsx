
import React, { useState, useEffect } from 'react';
import { format, parse, isValid, addMinutes, isBefore } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AppointmentSchedulerProps {
  onScheduleSelected?: (date: Date, timeSlot: string, timeZone: string) => void;
  productId?: string;
  productTitle?: string;
  sellerId?: string;
  onSchedulingComplete?: () => void;
  hourlyRate?: number;
}

// Time slots 9am to 5pm in 1-hour increments
const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

// Common time zones
const TIME_ZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'GMT/UTC' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' }
];

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({ 
  onScheduleSelected, 
  onSchedulingComplete,
  hourlyRate = 0
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dateInputValue, setDateInputValue] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [customTimeInput, setCustomTimeInput] = useState<string>("");
  const [isCustomTime, setIsCustomTime] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [selectedTimeZone, setSelectedTimeZone] = useState(() => {
    try {
      // Try to get the user's time zone
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      // Fallback to ET if we can't get the user's time zone
      return 'America/New_York';
    }
  });
  const { toast } = useToast();

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

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
  
  const handleTimeZoneChange = (value: string) => {
    setSelectedTimeZone(value);
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomTimeInput(e.target.value);
  };

  const handleTimeSelect = async (timeSlot: string) => {
    // Parse the selected time
    const timeParts = timeSlot.match(/(\d+):(\d+) ([AP]M)/);
    if (!timeParts || !selectedDate) return;
    
    let hours = parseInt(timeParts[1], 10);
    const minutes = parseInt(timeParts[2], 10);
    const isPM = timeParts[3] === 'PM';
    
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    // Create a date object for the selected date and time
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    // Check if selected time is in the past
    if (isBefore(selectedDateTime, currentDateTime)) {
      toast({
        title: "Invalid Time",
        description: "You cannot book appointments in the past.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedTimeSlot(timeSlot);
    setIsSubmitting(true);
    
    try {
      if (selectedDate && onScheduleSelected) {
        onScheduleSelected(selectedDate, timeSlot, selectedTimeZone);
        
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

  const handleCustomTimeSubmit = () => {
    if (!customTimeInput.trim()) {
      toast({
        title: "Invalid Time",
        description: "Please enter a valid time",
        variant: "destructive",
      });
      return;
    }
    
    handleTimeSelect(customTimeInput);
  };

  // Disable past dates and weekends
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (date < today) return true;
    
    // Disable dates more than 60 days in the future
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 60);
    if (date > maxDate) return true;
    
    return false;
  };

  // Check if a time slot is in the past
  const isTimeInPast = (timeSlot: string) => {
    if (!selectedDate) return false;
    
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // If selected date is in the future, time is not in the past
    if (selectedDate > today) return false;
    
    // If selected date is today, check the time
    const timeParts = timeSlot.match(/(\d+):(\d+) ([AP]M)/);
    if (!timeParts) return false;
    
    let hours = parseInt(timeParts[1], 10);
    const minutes = parseInt(timeParts[2], 10);
    const isPM = timeParts[3] === 'PM';
    
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    // Create a date object for the selected time today
    const timeToCheck = new Date();
    timeToCheck.setHours(hours, minutes, 0, 0);
    
    return timeToCheck <= now;
  };

  return (
    <div className="space-y-4 glass-card p-4 bg-background/95 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium">Schedule Your Consultation</h3>
      <p className="text-sm text-muted-foreground mb-4">Please select a date and time for your virtual consultation</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium block mb-2">Select Date</label>
          <div className="flex space-x-2">
            <Input
              type="date"
              value={dateInputValue}
              onChange={handleDateInputChange}
              className="w-full"
              placeholder="YYYY-MM-DD"
              min={format(new Date(), 'yyyy-MM-dd')}
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
          
          <div className="mt-4">
            <label className="text-sm font-medium block mb-2">Select Time Zone</label>
            <Select value={selectedTimeZone} onValueChange={handleTimeZoneChange}>
              <SelectTrigger className="w-full">
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Select time zone" />
                </div>
              </SelectTrigger>
              <SelectContent position="popper">
                {TIME_ZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {hourlyRate !== undefined && hourlyRate > 0 && (
            <div className="mt-4 p-3 border border-primary/20 rounded bg-primary/5">
              <p className="text-sm font-medium">
                Consultation Fee: <span className="text-primary">${hourlyRate.toFixed(2)}/hour</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You will be charged after the consultation is completed
              </p>
            </div>
          )}
        </div>
        
        <div>
          <label className="text-sm font-medium block mb-2">Select Time</label>
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <input 
                type="checkbox" 
                id="custom-time"
                checked={isCustomTime}
                onChange={e => setIsCustomTime(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="custom-time" className="text-sm">Enter custom time</label>
            </div>
            
            {isCustomTime ? (
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter time (e.g. 10:30 AM)"
                  value={customTimeInput}
                  onChange={handleCustomTimeChange}
                  className="flex-1"
                />
                <Button 
                  onClick={handleCustomTimeSubmit}
                  disabled={isSubmitting || !customTimeInput}
                >
                  Set
                </Button>
              </div>
            ) : (
              selectedDate ? (
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((timeSlot) => {
                    const isPastTime = isTimeInPast(timeSlot);
                    return (
                      <Button
                        key={timeSlot}
                        variant={selectedTimeSlot === timeSlot ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "w-full justify-center",
                          selectedTimeSlot === timeSlot && "bg-primary text-primary-foreground",
                          isPastTime && "opacity-50"
                        )}
                        onClick={() => handleTimeSelect(timeSlot)}
                        disabled={isSubmitting || isPastTime}
                      >
                        <Clock className="mr-1 h-3 w-3" /> {timeSlot}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Please select a date first</p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentScheduler;
