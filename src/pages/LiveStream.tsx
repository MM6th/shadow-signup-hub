
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useWebRTCStream } from '@/hooks/useWebRTCStream';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Mic, MicOff, Video as VideoIcon, VideoOff, Copy, Users, X } from 'lucide-react';
import PaymentDialog from '@/components/PaymentDialog';
import { ADMIN_IDS } from '@/hooks/useUserSession';

const LiveStream: React.FC = () => {
  const { conferenceId } = useParams<{ conferenceId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    isLoading, 
    isConnected, 
    startStream, 
    joinStream, 
    endStream, 
    playRecording,
    error 
  } = useWebRTCStream(conferenceId || '');
  
  const [livestreamData, setLivestreamData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasPaid, setHasPaid] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  
  // Check if current user is an admin
  const isAdmin = user ? ADMIN_IDS.includes(user.id) : false;
  
  // Fetch livestream data
  useEffect(() => {
    const fetchLivestreamData = async () => {
      if (!conferenceId) return;
      
      try {
        setIsLoadingData(true);
        
        // Get livestream data
        const { data, error } = await supabase
          .from('livestreams')
          .select('*')
          .eq('conference_id', conferenceId)
          .single();
          
        if (error) throw error;
        
        setLivestreamData(data);
        
        // Check if user is the host
        if (user && data.user_id === user.id) {
          setIsHost(true);
          setHasPaid(true); // Host doesn't need to pay
        }
        
        // Check if user has paid for this livestream
        if (user && !isHost) {
          // For now, we'll just set hasPaid to true for admins
          // In a real implementation, you'd check payment records
          if (isAdmin) {
            setHasPaid(true);
          }
        }
        
        // If the stream is not active, try to get recording URL
        if (!data.is_active) {
          const recordingUrlResult = await playRecording();
          setRecordingUrl(recordingUrlResult);
        }
        
      } catch (error: any) {
        console.error('Error fetching livestream data:', error);
        toast({
          title: "Error",
          description: "Failed to load livestream data",
          variant: "destructive",
        });
        
        // Navigate back if livestream doesn't exist
        navigate('/dashboard');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchLivestreamData();
  }, [conferenceId, user, navigate, toast, playRecording, isAdmin]);
  
  // Join the channel when hasPaid changes to true
  useEffect(() => {
    if (hasPaid && !isConnected && !isJoining && livestreamData?.is_active) {
      handleJoinStream();
    }
  }, [hasPaid, isConnected, isJoining, livestreamData]);
  
  const handleJoinStream = async () => {
    if (!user || !conferenceId || isJoining || isConnected) return;
    
    try {
      setIsJoining(true);
      
      let stream;
      if (isHost) {
        // Start stream as host
        stream = await startStream();
      } else {
        // Join stream as viewer
        stream = await joinStream();
      }
      
      if (!stream) {
        throw new Error('Failed to get media stream');
      }
      
      // Save reference to the stream
      if (isHost) {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } else {
        remoteStreamRef.current = stream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      }
      
      // Increment livestream views
      if (!isHost && livestreamData) {
        await supabase
          .from('livestreams')
          .update({ views: livestreamData.views + 1 })
          .eq('id', livestreamData.id);
      }
      
    } catch (error: any) {
      console.error('Error joining stream:', error);
      toast({
        title: "Error",
        description: `Failed to join livestream: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleEndStream = () => {
    // Stop streaming and clean up
    endStream();
    
    // Navigate back to dashboard
    navigate('/dashboard');
  };
  
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const newState = !isAudioOn;
        audioTracks.forEach(track => track.enabled = newState);
        setIsAudioOn(newState);
      }
    }
  };
  
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const newState = !isVideoOn;
        videoTracks.forEach(track => track.enabled = newState);
        setIsVideoOn(newState);
      }
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
  
  const handleSendMessage = () => {
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
  
  const handleWatchRecording = () => {
    if (recordingUrl) {
      window.open(recordingUrl, '_blank');
    } else {
      toast({
        title: "Recording unavailable",
        description: "The recording for this stream is not available",
        variant: "destructive"
      });
    }
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
  
  // For completed streams, show the recording player
  if (!livestreamData.is_active) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>{livestreamData.title}</CardTitle>
            <div className="text-sm text-gray-500">
              Recorded livestream - {new Date(livestreamData.created_at).toLocaleDateString()}
            </div>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <div className="aspect-video bg-gray-100 mb-4 rounded overflow-hidden">
              {recordingUrl ? (
                <video 
                  controls 
                  className="w-full h-full"
                  poster={livestreamData.thumbnail_url || undefined}
                >
                  <source src={recordingUrl} type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <VideoIcon className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={handleWatchRecording} disabled={!recordingUrl}>
                {recordingUrl ? 'Open Full Recording' : 'Recording Unavailable'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!hasPaid && !isHost) {
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
                  <p className="text-sm text-gray-500">Hosted by {livestreamData.host_name || "Admin"}</p>
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
            paypal_client_id: 'sb', // Replace with actual client ID
          }}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-4 px-4">
      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-120px)]">
        {/* Main content - video streams */}
        <div className="md:w-3/4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">{livestreamData.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="bg-red-500 text-white">Live</Badge>
                <span className="text-sm text-gray-500">
                  <Users className="h-4 w-4 inline mr-1" />
                  {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
                </span>
              </div>
            </div>
            
            {isHost && (
              <Button variant="outline" size="sm" onClick={handleCopyInviteLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Invite Link
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
            {/* Main video */}
            <div className="md:col-span-2">
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
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
                
                {isJoining && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                )}
                
                {!isConnected && !isJoining && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="text-center">
                      <VideoIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-white">Waiting to connect...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Secondary content - chat */}
            <div className="flex flex-col h-full">
              <Card className="h-full flex flex-col">
                <CardHeader className="p-4">
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
                
                <CardFooter className="p-4 border-t">
                  <form 
                    className="flex w-full gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
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
                </CardFooter>
              </Card>
            </div>
          </div>
          
          {/* Controls */}
          <div className="mt-4 p-4 border rounded-lg flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                variant={isAudioOn ? "default" : "destructive"}
                onClick={toggleAudio}
                disabled={!isConnected || !isHost}
              >
                {isAudioOn ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />}
                {isAudioOn ? "Mute" : "Unmute"}
              </Button>
              
              <Button
                variant={isVideoOn ? "default" : "destructive"}
                onClick={toggleVideo}
                disabled={!isConnected || !isHost}
              >
                {isVideoOn ? <VideoIcon className="h-4 w-4 mr-2" /> : <VideoOff className="h-4 w-4 mr-2" />}
                {isVideoOn ? "Hide Video" : "Show Video"}
              </Button>
            </div>
            
            <Button variant="destructive" onClick={handleEndStream}>
              <X className="h-4 w-4 mr-2" />
              {isHost ? "End Stream" : "Leave Stream"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStream;
