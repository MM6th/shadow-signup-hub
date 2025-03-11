
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User } from "lucide-react";
import { formatDate } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface AppointmentCardProps {
  appointment: {
    id: string;
    productTitle: string;
    customerName: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
  };
  isSeller: boolean;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  appointment, 
  isSeller 
}) => {
  const navigate = useNavigate();
  const formattedDate = formatDate(new Date(appointment.appointmentDate));
  const isPast = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`) < new Date();
  
  const isActive = appointment.status === 'scheduled' && !isPast;
  const statusText = isPast ? 'Completed' : appointment.status;
  
  const handleJoinMeeting = () => {
    navigate(`/video-conference/${appointment.id}`);
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <h3 className="text-lg font-semibold">{appointment.productTitle}</h3>
          
          <div className="flex items-center text-sm text-gray-500">
            <Calendar size={16} className="mr-2" />
            <span>{formattedDate}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <Clock size={16} className="mr-2" />
            <span>{appointment.appointmentTime}</span>
          </div>
          
          {isSeller && (
            <div className="flex items-center text-sm text-gray-500">
              <User size={16} className="mr-2" />
              <span>Client: {appointment.customerName}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-4">
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {statusText}
            </div>
            
            {isActive && (
              <Button 
                variant="default" 
                size="sm"
                onClick={handleJoinMeeting}
              >
                Join Meeting
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentCard;
