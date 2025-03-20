
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useAgoraVideo } from '@/hooks/useAgoraVideo';
import AgoraRTC from 'agora-rtc-sdk-ng';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import LocalVideo from '@/components/video-conference/LocalVideo';
import RemoteVideo from '@/components/video-conference/RemoteVideo';
import { Send, Mic, MicOff, Video as VideoIcon, VideoOff, Copy, Users, Settings, X } from 'lucide-react';
import PaymentDialog from '@/components/PaymentDialog';
import { ADMIN_IDS } from '@/hooks/useUserSession';

// AgoraRTC client options
const rtcClientOptions = {
  mode: 'rtc',
  codec: 'vp8',
};

const LiveStream: React.FC = () => {
  const { conferenceId } = useParams<{ conferenceId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { generateToken, joinChannel } = useAgoraVideo(conferenceId || '');
  
  const [livestreamData, setLivestreamData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPaid, setHasPaid] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<any>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<any>(null);
  const [remoteUid, setRemoteUid] = useState<string | null>(null);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Refs
  const rtcClient = useRef<any>(null);
  
  // Check if current user is an admin
  const isAdmin = user ? ADMIN_IDS.includes(user.id) : false;
  
  // Fetch livestream data
  useEffect(() => {
    const fetchLivestreamData = async () => {
      if (!conferenceId) return;
      
      try {
        setIsLoading(true);
        
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
        setIsLoading(false);
      }
    };
    
    fetchLivestreamData();
  }, [conferenceId, user, navigate, toast]);
  
  // Initialize Agora client when component mounts
  useEffect(() => {
    const initializeClient = async () => {
      try {
        // Create RTC client
        const client = AgoraRTC.createClient(rtcClientOptions);
        rtcClient.current = client;
        
        // Set up event handlers
        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          console.log('Subscribe success:', user.uid, mediaType);
          
          if (mediaType === 'video') {
            setRemoteVideoTrack(user.videoTrack);
            setRemoteUid(user.uid.toString());
          }
          
          if (mediaType === 'audio') {
            setRemoteAudioTrack(user.audioTrack);
            user.audioTrack?.play();
          }
          
          // Increase viewer count for host
          if (isHost) {
            setViewerCount(prev => prev + 1);
          }
        });
        
        client.on('user-unpublished', (user, mediaType) => {
          console.log('Unsubscribe:', user.uid, mediaType);
          
          if (mediaType === 'video') {
            setRemoteVideoTrack(null);
          }
          
          if (mediaType === 'audio') {
            setRemoteAudioTrack(null);
          }
          
          // Decrease viewer count for host
          if (isHost) {
            setViewerCount(prev => Math.max(0, prev - 1));
          }
        });
        
        client.on('user-left', (user) => {
          console.log('User left:', user.uid);
          if (user.uid.toString() === remoteUid) {
            setRemoteVideoTrack(null);
            setRemoteAudioTrack(null);
            setRemoteUid(null);
          }
          
          // Decrease viewer count for host
          if (isHost) {
            setViewerCount(prev => Math.max(0, prev - 1));
          }
        });
        
      } catch (error) {
        console.error('Error initializing Agora client:', error);
      }
    };
    
    initializeClient();
    
    // Clean up when component unmounts
    return () => {
      leaveChannel();
    };
  }, [isHost]);
  
  // Join the channel when hasPaid changes to true
  useEffect(() => {
    if (hasPaid && !isConnected && !isJoining) {
      handleJoinStream();
    }
  }, [hasPaid, isConnected, isJoining]);
  
  const handleJoinStream = async () => {
    if (!user || !conferenceId || isJoining || isConnected) return;
    
    try {
      setIsJoining(true);
      
      // Generate token
      const tokenData = await generateToken(user.id);
      
      if (!tokenData) {
        throw new Error('Failed to generate token');
      }
      
      // Create local audio and video tracks
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);
      
      // Join the channel
      await joinChannel(
        rtcClient.current,
        audioTrack,
        videoTrack,
        tokenData.token,
        tokenData.channelName
      );
      
      setIsConnected(true);
      
      // Increment livestream views
      if (!isHost) {
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
  
  const leaveChannel = async () => {
    try {
      // Release local tracks
      localAudioTrack?.close();
      localVideoTrack?.close();
      
      // Leave the channel
      if (rtcClient.current) {
        await rtcClient.current.leave();
      }
      
      // Reset state
      setLocalAudioTrack(null);
      setLocalVideoTrack(null);
      setRemoteVideoTrack(null);
      setRemoteAudioTrack(null);
      setRemoteUid(null);
      setIsConnected(false);
      
    } catch (error) {
      console.error('Error leaving channel:', error);
    }
  };
  
  const toggleAudio = async () => {
    if (localAudioTrack) {
      const newState = !isAudioOn;
      localAudioTrack.setEnabled(newState);
      setIsAudioOn(newState);
    }
  };
  
  const toggleVideo = async () => {
    if (localVideoTrack) {
      const newState = !isVideoOn;
      localVideoTrack.setEnabled(newState);
      setIsVideoOn(newState);
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
  
  if (isLoading) {
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
                <Badge variant="outline">Live</Badge>
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
            {/* Main video - remote for viewers, local for host */}
            <div className="md:col-span-2">
              {isHost ? (
                <LocalVideo 
                  videoTrack={localVideoTrack} 
                  isVideoOn={isVideoOn} 
                  isHost={true}
                />
              ) : (
                <RemoteVideo 
                  isConnected={isConnected} 
                  videoTrack={remoteVideoTrack}
                  videoMuted={false}
                />
              )}
            </div>
            
            {/* Secondary video - local for viewers, remote for host */}
            <div>
              {isHost ? (
                <RemoteVideo 
                  isConnected={isConnected} 
                  videoTrack={remoteVideoTrack}
                  videoMuted={false}
                />
              ) : (
                <LocalVideo 
                  videoTrack={localVideoTrack} 
                  isVideoOn={isVideoOn}
                />
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className="mt-4 p-4 border rounded-lg flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                variant={isAudioOn ? "default" : "destructive"}
                onClick={toggleAudio}
                disabled={!isConnected}
              >
                {isAudioOn ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />}
                {isAudioOn ? "Mute" : "Unmute"}
              </Button>
              
              <Button
                variant={isVideoOn ? "default" : "destructive"}
                onClick={toggleVideo}
                disabled={!isConnected}
              >
                {isVideoOn ? <VideoOff className="h-4 w-4 mr-2" /> : <VideoIcon className="h-4 w-4 mr-2" />}
                {isVideoOn ? "Hide Video" : "Show Video"}
              </Button>
            </div>
            
            <Button variant="destructive" onClick={() => navigate('/dashboard')}>
              End & Exit
            </Button>
          </div>
        </div>
        
        {/* Chat sidebar */}
        <div className="md:w-1/4 flex flex-col h-full">
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
    </div>
  );
};

export default LiveStream;
