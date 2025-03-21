
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from 'lucide-react';
import AppointmentCard from './AppointmentCard';

interface AppointmentManagerProps {
  isSeller?: boolean;
}

const AppointmentManager: React.FC<AppointmentManagerProps> = ({ isSeller = false }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Query appointments directly from the database
        let query;
        
        if (isSeller) {
          query = supabase
            .from('appointments')
            .select('*')
            .eq('seller_id', user.id)
            .order('appointment_date', { ascending: true });
        } else {
          query = supabase
            .from('appointments')
            .select('*')
            .eq('buyer_id', user.id)
            .order('appointment_date', { ascending: true });
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        setAppointments(data || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        toast({
          title: 'Error fetching appointments',
          description: 'Failed to load your appointments. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAppointments();
  }, [user, isSeller, toast]);

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="animate-pulse space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="glass-card p-4 h-32" />
          ))}
        </div>
      </div>
    );
  }
  
  if (appointments.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <Calendar className="mx-auto h-12 w-12 text-pi-muted mb-2" />
        <h3 className="text-lg font-medium mb-1">No Appointments</h3>
        <p className="text-pi-muted">
          {isSeller
            ? "You don't have any scheduled consultations yet."
            : "You haven't booked any consultations yet."}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          isSeller={isSeller}
        />
      ))}
    </div>
  );
};

export default AppointmentManager;
