
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
  const [isInitializing, setIsInitializing] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [participants, setParticipants] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{sender: string, message: string}>>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initWebRTC = async () => {
      try {
        setIsInitializing(true);
        console.log('Initializing WebRTC...');
        
        // Request camera and microphone permissions
        console.log('Requesting media devices...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        console.log('Media devices granted!', stream);
        
        // Check if we have video tracks
        const videoTracks = stream.getVideoTracks();
        console.log('Video tracks:', videoTracks.length > 0 ? 'Available' : 'None available');
        
        if (videoTracks.length === 0) {
          toast({
            title: "No camera detected",
            description: "Could not detect a camera on your device.",
            variant: "destructive",
          });
        }
        
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          console.log('Local video source set');
        }
        
        const configuration = { 
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] 
        };
        
        peerConnectionRef.current = new RTCPeerConnection(configuration);
        
        stream.getTracks().forEach(track => {
          if (peerConnectionRef.current) {
            console.log('Adding track to peer connection:', track.kind);
            peerConnectionRef.current.addTrack(track, stream);
          }
        });
        
        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams && event.streams[0]) {
            console.log('Remote video stream received');
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };
        
        const channel = supabase.channel(`room:${roomId}`);
        
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
              console.log('Subscribed to channel, tracking presence');
              await channel.track({
                user_id: user?.id || 'anonymous',
                online_at: new Date().toISOString(),
              });
              
              setTimeout(() => {
                setIsConnected(true);
                toast({
                  title: "Connected to room",
                  description: `You've joined room: ${roomId}`,
                });
              }, 1000);
            }
          });
        
        setIsInitializing(false);
        setPermissionError(null);
        
        return () => {
          console.log('Cleaning up WebRTC...');
          channel.unsubscribe();
          
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
          }
          
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
          }
        };
      } catch (error) {
        console.error('Error initializing WebRTC:', error);
        setIsInitializing(false);
        
        // Set a more helpful error message
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Could not access your camera or microphone';
        
        setPermissionError(errorMessage);
        
        toast({
          title: "Camera/Microphone Error",
          description: "Could not access your camera or microphone. Please check permissions.",
          variant: "destructive",
        });
      }
    };
    
    initWebRTC();
  }, [roomId, toast, user]);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioTrack = audioTracks[0];
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
        console.log('Mic toggled:', audioTrack.enabled);
      }
    }
  };
  
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0];
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
        console.log('Video track toggled:', videoTrack.enabled);
      } else {
        console.log('No video tracks found');
        toast({
          title: "No camera available",
          description: "Could not detect a camera on your device.",
          variant: "destructive",
        });
      }
    } else {
      console.log('No local stream available');
    }
  };
  
  const sendMessage = () => {
    if (!messageInput.trim()) return;
    
    const channel = supabase.channel(`room:${roomId}`);
    channel.send({
      type: 'broadcast',
      event: 'chat',
      payload: {
        message: messageInput,
        sender: user?.email || 'Anonymous'
      }
    });
    
    setChatMessages(prev => [...prev, {
      sender: 'You',
      message: messageInput
    }]);
    
    setMessageInput('');
  };
  
  const shareStream = () => {
    const shareUrl = `${window.location.origin}/marketplace?join=${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Stream link copied to clipboard. Share with others to join!",
    });
  };
  
  const handleEndCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsConnected(false);
    
    if (onEndCall) {
      onEndCall();
    }
  };

  // Show permission error if one exists
  if (permissionError) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center h-full">
        <div className="text-center space-y-4">
          <VideoOff size={48} className="mx-auto text-red-500" />
          <h3 className="text-lg font-medium text-red-400">Camera Permission Error</h3>
          <p className="text-pi-muted">{permissionError}</p>
          <p className="text-pi-muted text-sm">
            Please allow camera and microphone access in your browser settings and reload the page.
          </p>
          <Button onClick={handleEndCall} variant="destructive">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isInitializing) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin h-10 w-10 border-4 border-pi-focus border-t-transparent rounded-full mx-auto"></div>
          <p className="text-pi-muted">Initializing camera and microphone...</p>
          <p className="text-pi-muted text-sm">
            Please allow camera and microphone access when prompted by your browser.
          </p>
        </div>
      </div>
    );
  }

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
