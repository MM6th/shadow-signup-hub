
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Mic, MicOff, VideoOff, Phone, MessageSquare, Users, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface VideoConferenceProps {
  roomId: string;
  isHost?: boolean;
  onEndCall?: () => void;
}

const VideoConference: React.FC<VideoConferenceProps> = ({ 
  roomId, 
  isHost = false,
  onEndCall
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [participants, setParticipants] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{sender: string, message: string}>>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize WebRTC
  useEffect(() => {
    const initWebRTC = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        // Save local stream
        localStreamRef.current = stream;
        
        // Display local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Create peer connection
        const configuration = { 
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] 
        };
        
        peerConnectionRef.current = new RTCPeerConnection(configuration);
        
        // Add local tracks to peer connection
        stream.getTracks().forEach(track => {
          if (peerConnectionRef.current) {
            peerConnectionRef.current.addTrack(track, stream);
          }
        });
        
        // Set up remote stream handling
        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };
        
        // In a real app, you would set up signaling here
        // For now, we'll use Supabase Realtime for simple presence and chat
        
        // Set up channel for room communication
        const channel = supabase.channel(`room:${roomId}`);
        
        // Subscribe to the channel for chat messages
        channel
          .on('broadcast', { event: 'chat' }, (payload) => {
            if (payload.payload && payload.payload.message && payload.payload.sender) {
              setChatMessages(prev => [...prev, {
                sender: payload.payload.sender,
                message: payload.payload.message
              }]);
            }
          })
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const userIds = Object.keys(state);
            setParticipants(userIds);
          })
          .on('presence', { event: 'join' }, ({ key }) => {
            toast({
              title: "New participant",
              description: `Someone has joined the stream`,
            });
            
            // Update connection status after a new participant joins
            setTimeout(() => {
              setIsConnected(true);
            }, 1000);
          })
          .on('presence', { event: 'leave' }, ({ key }) => {
            toast({
              title: "Participant left",
              description: `Someone has left the stream`,
            });
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              // Track our presence in the room
              await channel.track({
                user_id: user?.id || 'anonymous',
                online_at: new Date().toISOString(),
              });
              
              // For demo purposes, we'll just set connected after initialization
              setTimeout(() => {
                setIsConnected(true);
                toast({
                  title: "Connected to room",
                  description: `You've joined room: ${roomId}`,
                });
              }, 1000);
            }
          });
          
        // Clean up function to remove channel subscription
        return () => {
          channel.unsubscribe();
          
          // Close peer connection
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
          }
          
          // Stop all tracks in local stream
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
          }
        };
      } catch (error) {
        console.error('Error initializing WebRTC:', error);
        toast({
          title: "Camera/Microphone Error",
          description: "Could not access your camera or microphone. Please check permissions.",
          variant: "destructive",
        });
      }
    };
    
    initWebRTC();
  }, [roomId, toast, user]);
  
  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // Toggle microphone
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };
  
  // Send chat message
  const sendMessage = () => {
    if (!messageInput.trim()) return;
    
    // Broadcast the message to the channel
    const channel = supabase.channel(`room:${roomId}`);
    channel.send({
      type: 'broadcast',
      event: 'chat',
      payload: {
        message: messageInput,
        sender: user?.email || 'Anonymous'
      }
    });
    
    // Add message to local state
    setChatMessages(prev => [...prev, {
      sender: 'You',
      message: messageInput
    }]);
    
    // Clear input
    setMessageInput('');
  };
  
  // Share the stream link
  const shareStream = () => {
    const shareUrl = `${window.location.origin}/marketplace?join=${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Stream link copied to clipboard. Share with others to join!",
    });
  };
  
  // End call
  const handleEndCall = () => {
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Stop all tracks in local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsConnected(false);
    
    if (onEndCall) {
      onEndCall();
    }
  };

  return (
    <div className="glass-card p-4 flex flex-col h-full">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">
          {isConnected ? 'Connected' : 'Connecting...'} - Room: {roomId.substring(0, 8)}...
        </h3>
        <div className="flex items-center gap-2">
          {isHost && (
            <div className="px-2 py-1 bg-pi-focus/10 text-pi-focus rounded text-xs font-medium">
              Host
            </div>
          )}
          <div className="px-2 py-1 bg-dark-secondary rounded text-xs flex items-center">
            <Users size={14} className="mr-1" />
            {participants.length} watching
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 flex-grow">
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local video */}
          <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
              You {isHost ? '(Host)' : ''}
            </div>
          </div>
          
          {/* Remote video */}
          <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
              {isConnected ? 'Remote User' : 'Waiting for connection...'}
            </div>
          </div>
        </div>
        
        {/* Chat sidebar */}
        {showChat && (
          <div className="w-full md:w-64 bg-dark-secondary rounded-lg overflow-hidden flex flex-col">
            <div className="p-3 border-b border-dark-accent flex items-center justify-between">
              <h4 className="font-medium text-sm">Live Chat</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0" 
                onClick={() => setShowChat(false)}
              >
                ×
              </Button>
            </div>
            <div 
              ref={chatContainerRef}
              className="flex-grow p-3 overflow-y-auto space-y-2 max-h-[200px] md:max-h-none"
            >
              {chatMessages.length === 0 ? (
                <div className="text-center text-pi-muted text-sm py-4">
                  No messages yet
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium text-pi-focus">{msg.sender}: </span>
                    <span>{msg.message}</span>
                  </div>
                ))
              )}
            </div>
            <div className="p-2 border-t border-dark-accent flex">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="bg-dark-accent rounded-l px-2 py-1 text-sm flex-grow"
              />
              <button 
                onClick={sendMessage}
                className="bg-pi-focus text-white rounded-r px-2 py-1 text-sm"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-center space-x-4 mt-4">
        <Button
          variant="outline"
          className={!isMicOn ? "bg-destructive text-white" : ""}
          onClick={toggleMic}
        >
          {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
        </Button>
        
        <Button
          variant="outline"
          className={!isVideoOn ? "bg-destructive text-white" : ""}
          onClick={toggleVideo}
        >
          {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setShowChat(!showChat)}
          className={showChat ? "bg-pi-focus text-white" : ""}
        >
          <MessageSquare size={18} />
        </Button>
        
        <Button
          variant="outline"
          onClick={shareStream}
        >
          <Share size={18} />
        </Button>
        
        <Button
          variant="destructive"
          onClick={handleEndCall}
        >
          <Phone size={18} className="rotate-135" />
        </Button>
      </div>
    </div>
  );
};

export default VideoConference;
