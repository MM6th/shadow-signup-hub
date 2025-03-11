
import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AppointmentCardProps {
  id: string;
  productTitle: string;
  customerName: string;
  appointmentDate: string; // ISO string
  appointmentTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  isSeller?: boolean;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  id,
  productTitle,
  customerName,
  appointmentDate,
  appointmentTime,
  status,
  isSeller = false
}) => {
  const navigate = useNavigate();
  const formattedDate = format(new Date(appointmentDate), 'PPP');
  
  const getStatusColor = () => {
    switch (status) {
      case 'scheduled': return 'bg-amber-500/10 text-amber-500';
      case 'completed': return 'bg-green-500/10 text-green-500';
      case 'cancelled': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };
  
  const joinCall = () => {
    navigate(`/video-conference/${id}`);
  };
  
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex justify-between items-start">
        <h3 className="font-medium">{productTitle}</h3>
        <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor()}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>
      
      <div className="flex flex-col space-y-2">
        <div className="flex items-center text-sm text-pi-muted">
          <User size={14} className="mr-2" />
          {isSeller ? `Customer: ${customerName}` : 'Consultant'}
        </div>
        
        <div className="flex items-center text-sm text-pi-muted">
          <Calendar size={14} className="mr-2" />
          {formattedDate}
        </div>
        
        <div className="flex items-center text-sm text-pi-muted">
          <Clock size={14} className="mr-2" />
          {appointmentTime}
        </div>
      </div>
      
      {status === 'scheduled' && (
        <div className="flex justify-end">
          <Button 
            onClick={joinCall}
            className="flex items-center"
          >
            <Video size={16} className="mr-2" /> Join Call
          </Button>
        </div>  
      )}
    </div>
  );
};

export default AppointmentCard;
