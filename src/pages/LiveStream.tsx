import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useStreamConnection } from '@/hooks/useStreamConnection';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Mic, MicOff, Video as VideoIcon, VideoOff, Copy, Users, X } from 'lucide-react';
import PaymentDialog from '@/components/PaymentDialog';
import { LivestreamType, isStreamActive } from '@/components/livestream/types';

const LiveStream: React.FC = () => {
  const { conferenceId } = useParams<{ conferenceId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [livestreamData, setLivestreamData] = useState<LivestreamType | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasPaid, setHasPaid] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const {
    isLoading,
    isConnected,
    isHost,
    error,
    localStream,
    remoteStream,
    startStream,
    joinStream,
    endStream
  } = useStreamConnection(conferenceId || '');
  
  useEffect(() => {
    const fetchLivestreamData = async () => {
      if (!conferenceId) return;
      
      try {
        setIsLoadingData(true);
        
        const { data, error } = await supabase
          .from('livestreams')
          .select('*')
          .eq('conference_id', conferenceId)
          .single();
          
        if (error) throw error;
        
        console.log("Fetched livestream data:", data);
        setLivestreamData(data);
        
        if (user && data.user_id === user.id) {
          setHasPaid(true);
        } else {
          setHasPaid(true);
        }
        
      } catch (error: any) {
        console.error('Error fetching livestream data:', error);
        toast({
          title: "Error",
          description: "Failed to load livestream data",
          variant: "destructive",
        });
        
        navigate('/dashboard');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchLivestreamData();
  }, [conferenceId, user, navigate, toast]);
  
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
    
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);
  
  useEffect(() => {
    const initializeStream = async () => {
      if (!livestreamData || !hasPaid || !user || isConnected) return;
      
      try {
        const isUserHost = user.id === livestreamData.user_id;
        
        if (isUserHost) {
          console.log("Starting stream as host...");
          await startStream();
        } else {
          console.log("Joining stream as viewer...");
          await joinStream();
        }
        
        if (!isUserHost && livestreamData) {
          try {
            await supabase
              .from('livestreams')
              .update({ views: livestreamData.views + 1 })
              .eq('id', livestreamData.id);
          } catch (error) {
            console.error("Error updating view count:", error);
          }
        }
      } catch (error) {
        console.error("Error initializing stream:", error);
      }
    };
    
    initializeStream();
  }, [livestreamData, hasPaid, user, isConnected, startStream, joinStream]);
  
  const handleEndStream = () => {
    endStream();
    navigate('/dashboard');
    
    if (isHost && livestreamData) {
      try {
        const { error } = supabase
          .from('livestreams')
          .update({ 
            is_active: false,
            ended_at: new Date().toISOString()
          })
          .eq('id', livestreamData.id);
          
        if (error) {
          console.error('Error marking livestream as ended:', error);
        } else {
          console.log('Livestream marked as ended');
        }
      } catch (err) {
        console.error('Error in handleEndStream:', err);
      }
    }
  };
  
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => track.enabled = !isAudioOn);
      setIsAudioOn(!isAudioOn);
    }
  };
  
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => track.enabled = !isVideoOn);
      setIsVideoOn(!isVideoOn);
    }
  };
  
  const handlePayment = () => {
    setIsPaymentDialogOpen(true);
  };
  
  const handlePaymentSuccess = () => {
    setHasPaid(true);
    setIsPaymentDialogOpen(false);
    toast({
      title: "Payment successful",
      description: "You can now join the livestream"
    });
  };
  
  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/livestream/${conferenceId}`;
    
    try {
      navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Link copied",
        description: "Livestream link copied to clipboard"
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy this URL: " + inviteLink,
        variant: "destructive"
      });
    }
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now().toString(),
      sender: user?.user_metadata?.full_name || user?.email || 'User',
      content: newMessage.trim(),
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };
  
  if (isLoadingData) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!livestreamData) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Livestream Not Found</h2>
            <p className="mb-6">This livestream doesn't exist or has ended.</p>
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const isStreamStillActive = isStreamActive(livestreamData);
  
  if (!isStreamStillActive) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>{livestreamData.title}</CardTitle>
            <div className="text-sm text-gray-500">
              Ended {new Date(livestreamData.ended_at || livestreamData.created_at).toLocaleString()}
            </div>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <div className="aspect-video bg-gray-100 mb-4 rounded overflow-hidden">
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <VideoIcon className="h-16 w-16 text-gray-400" />
              </div>
            </div>
            <p className="mb-6">This livestream has ended.</p>
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!hasPaid) {
    return (
      <div className="container mx-auto py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{livestreamData.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Join This Livestream</h3>
              <p className="text-gray-500 mb-4">
                To access this livestream, a payment is required.
              </p>
              
              <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg mb-4">
                <div>
                  <p className="font-medium">Livestream Access</p>
                  <p className="text-sm text-gray-500">Hosted by {user?.email || "Host"}</p>
                </div>
                <p className="font-bold">$5.00</p>
              </div>
            </div>
            
            <Button className="w-full" onClick={handlePayment}>
              Pay Now to Join
            </Button>
          </CardContent>
        </Card>
        
        <PaymentDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          product={{
            id: livestreamData.id,
            title: livestreamData.title,
            price: 5.00,
            enable_paypal: true,
            paypal_client_id: 'sb',
          }}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">{livestreamData.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-red-500 text-white">Live</Badge>
                  <span className="text-sm text-gray-500">
                    <Users className="h-4 w-4 inline mr-1" />
                    {viewerCount} viewers
                  </span>
                </div>
              </div>
              
              {isHost && (
                <Button variant="outline" size="sm" onClick={handleCopyInviteLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Share Link
                </Button>
              )}
            </div>
          </div>
          
          <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden mb-4">
            {isHost ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center">
                  <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-white">Connecting to stream...</p>
                </div>
              </div>
            )}
            
            {!isConnected && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center">
                  <VideoIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-white mb-2">Waiting to connect...</p>
                  {error && <p className="text-red-400">{error}</p>}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center p-4 border rounded-lg">
            <div className="flex space-x-3">
              {isHost && (
                <>
                  <Button
                    variant={isAudioOn ? "outline" : "destructive"}
                    size="sm"
                    onClick={toggleAudio}
                    disabled={!isConnected}
                  >
                    {isAudioOn ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />}
                    {isAudioOn ? "Mute" : "Unmute"}
                  </Button>
                  
                  <Button
                    variant={isVideoOn ? "outline" : "destructive"}
                    size="sm"
                    onClick={toggleVideo}
                    disabled={!isConnected}
                  >
                    {isVideoOn ? <VideoIcon className="h-4 w-4 mr-2" /> : <VideoOff className="h-4 w-4 mr-2" />}
                    {isVideoOn ? "Hide Video" : "Show Video"}
                  </Button>
                </>
              )}
            </div>
            
            <Button variant="destructive" size="sm" onClick={handleEndStream}>
              <X className="h-4 w-4 mr-2" />
              {isHost ? "End Stream" : "Leave Stream"}
            </Button>
          </div>
        </div>
        
        <div className="h-[calc(100vh-200px)] flex flex-col">
          <Card className="h-full flex flex-col">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-lg">Live Chat</CardTitle>
            </CardHeader>
            
            <CardContent className="flex-grow overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 h-full flex items-center justify-center">
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="p-2 border-b">
                      <div className="flex justify-between">
                        <span className="font-medium">{message.sender}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p>{message.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            
            <div className="p-4 border-t">
              <form 
                className="flex gap-2"
                onSubmit={handleSendMessage}
              >
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-grow"
                />
                <Button type="submit" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveStream;
