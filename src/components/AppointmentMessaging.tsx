
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { MessageCircle, Send, Clock, Calendar, RefreshCw, Video } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  appointment_id?: string;
  sender_name?: string;
}

interface Appointment {
  id: string;
  product_title: string;
  buyer_name: string;
  buyer_id: string;
  seller_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

const AppointmentMessaging: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [receiverId, setReceiverId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAppointment) {
      fetchMessages();
      
      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel('appointment-messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `appointment_id=eq.${selectedAppointment}`
        }, (payload) => {
          // Add new message to the list
          const newMsg = payload.new as Message;
          setMessages(prevMessages => [...prevMessages, newMsg]);
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [selectedAppointment]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      // For sellers, get all appointments where they are the seller
      // For buyers, get all appointments where they are the buyer
      const { data, error } = await supabase
        .from('appointments')
        .select('id, product_title, buyer_name, buyer_id, seller_id, appointment_date, appointment_time, status')
        .or(`seller_id.eq.${user?.id},buyer_id.eq.${user?.id}`)
        .order('appointment_date', { ascending: false });
        
      if (error) throw error;
      
      setAppointments(data || []);
      
      // Select first appointment by default if available
      if (data && data.length > 0 && !selectedAppointment) {
        setSelectedAppointment(data[0].id);
        // If user is seller, receiver is buyer, and vice versa
        const receiverId = user?.id === data[0].buyer_id 
          ? data[0].seller_id 
          : data[0].buyer_id;
          
        setReceiverId(receiverId);
      }
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedAppointment) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('appointment_id', selectedAppointment)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      setMessages(data || []);
      
      // Mark messages as read
      const unreadMessages = data?.filter(
        msg => !msg.is_read && msg.receiver_id === user?.id
      );
      
      if (unreadMessages && unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map(msg => msg.id));
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  const handleAppointmentSelect = (appointmentId: string) => {
    setSelectedAppointment(appointmentId);
    
    // Find the selected appointment
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;
    
    // If user is seller, receiver is buyer, and vice versa
    const receiverId = user?.id === appointment.buyer_id 
      ? appointment.seller_id 
      : appointment.buyer_id;
      
    setReceiverId(receiverId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedAppointment || !user || !receiverId) return;
    
    setIsSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content: newMessage.trim(),
          appointment_id: selectedAppointment,
          is_read: false,
          sender_name: user.user_metadata?.full_name || user.email
        });
        
      if (error) throw error;
      
      // Clear input after sending
      setNewMessage('');
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendVideoInvite = async () => {
    if (!selectedAppointment || !user || !receiverId) return;
    
    setIsSending(true);
    try {
      // Generate a unique room ID based on appointment ID
      const roomId = `room-${selectedAppointment.substring(0, 8)}`;
      
      // Send a message with video invite
      const message = `I've started a video consultation. Join me at this link: /video-conference/${roomId}`;
      
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content: message,
          appointment_id: selectedAppointment,
          is_read: false,
          sender_name: user.user_metadata?.full_name || user.email
        });
        
      if (error) throw error;
      
      toast({
        title: "Video Invite Sent",
        description: "Your invitation to join the video conference has been sent"
      });
      
      // Navigate to the video conference page
      window.open(`/video-conference/${roomId}`, '_blank');
      
    } catch (error: any) {
      console.error('Error sending video invite:', error);
      toast({
        title: "Error",
        description: "Failed to send video invite",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'MMM d, h:mm a');
  };

  const getSelectedAppointment = () => {
    return appointments.find(apt => apt.id === selectedAppointment);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Appointments</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={fetchAppointments}
              title="Refresh appointments"
            >
              <RefreshCw size={16} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin h-6 w-6 border-2 border-pi-focus border-t-transparent rounded-full"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No appointments found</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {appointments.map(appointment => (
                  <div 
                    key={appointment.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedAppointment === appointment.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-secondary'
                    }`}
                    onClick={() => handleAppointmentSelect(appointment.id)}
                  >
                    <div className="font-medium">{appointment.product_title}</div>
                    <div className="text-sm opacity-80">
                      {appointment.buyer_id === user?.id ? 'Seller' : 'Client'}: {appointment.buyer_name}
                    </div>
                    <div className="flex items-center text-xs mt-1 opacity-70">
                      <Calendar className="h-3 w-3 mr-1" />
                      {appointment.appointment_date}
                    </div>
                    <div className="flex items-center text-xs mt-1 opacity-70">
                      <Clock className="h-3 w-3 mr-1" />
                      {appointment.appointment_time}
                    </div>
                    <div className="mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        appointment.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : appointment.status === 'canceled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              <span>Messages</span>
            </div>
            {selectedAppointment && (
              <Button
                onClick={handleSendVideoInvite}
                variant="outline"
                className="ml-auto flex items-center"
                disabled={isSending}
              >
                <Video className="h-4 w-4 mr-2" />
                Start Video Call
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {!selectedAppointment ? (
            <div className="text-center p-10 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Select an appointment to view messages</p>
            </div>
          ) : (
            <>
              <div className="mb-4 bg-muted p-3 rounded-md">
                <p className="font-medium">{getSelectedAppointment()?.product_title}</p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {getSelectedAppointment()?.appointment_date}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {getSelectedAppointment()?.appointment_time}
                  </div>
                </div>
              </div>
              
              <ScrollArea className="h-[300px] mb-4 p-3 border rounded-md">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-4 text-muted-foreground">
                    <div>
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No messages yet</p>
                      <p className="text-xs">Start the conversation by sending a message</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map(message => (
                      <div 
                        key={message.id}
                        className={`flex ${
                          message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div 
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.sender_id === user?.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-secondary'
                          }`}
                        >
                          <div className="text-sm">{message.content}</div>
                          <div className="text-xs mt-1 opacity-70 flex justify-between">
                            <span>{message.sender_name || 'User'}</span>
                            <span>{formatMessageDate(message.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </CardContent>
        
        <CardFooter>
          <div className="w-full flex space-x-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={!selectedAppointment || isSending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || !selectedAppointment || isSending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AppointmentMessaging;
