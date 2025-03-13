
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLiveSessions } from '@/hooks/useLiveSessions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Video, Mic } from 'lucide-react';

interface LiveSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LiveSessionDialog: React.FC<LiveSessionDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState<'initial' | 'permissions' | 'ready'>('initial');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const { startLiveSession, isLoading } = useLiveSessions();
  const { toast } = useToast();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Request camera permissions before starting the session
  const requestMediaPermissions = async (): Promise<void> => {
    setStage('permissions');
    setPermissionError(null);
    
    try {
      console.log('Requesting camera and microphone permissions...');
      // First try to access the camera and microphone
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      console.log('Permissions granted, stream obtained:', mediaStream);
      
      // Show preview of camera
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      setStage('ready');
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      setPermissionError(
        error instanceof Error 
          ? error.message 
          : 'Could not access your camera or microphone. Please check your device settings.'
      );
      
      toast({
        title: 'Permission Error',
        description: 'Camera and microphone access is required for live sessions. Please enable permissions and try again.',
        variant: 'destructive',
      });
      
      setStage('initial');
    }
  };

  const handleStartSession = async () => {
    if (!title.trim() || !stream) return;
    
    console.log('Starting live session with title:', title);
    
    // Start the session
    const session = await startLiveSession(title);
    
    if (session) {
      console.log('Session created successfully:', session);
      // Close the dialog
      onOpenChange(false);
      
      // Reset the form
      setTitle('');
      setStage('initial');
    }
  };

  const handleCancel = () => {
    // Stop any active media streams
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    // Reset state
    setStage('initial');
    setTitle('');
    setPermissionError(null);
    
    // Close dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleCancel();
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Live Session</DialogTitle>
          <DialogDescription>
            {stage === 'initial' && "Enter a title for your live session"}
            {stage === 'permissions' && "Please allow access to your camera and microphone"}
            {stage === 'ready' && "You're ready to go live! Check your preview below."}
          </DialogDescription>
        </DialogHeader>
        
        {stage === 'initial' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title</Label>
              <Input
                id="title"
                placeholder="Enter a title for your live session"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={requestMediaPermissions}
                disabled={!title.trim() || isLoading}
              >
                Prepare Camera
              </Button>
            </DialogFooter>
          </div>
        )}
        
        {stage === 'permissions' && (
          <div className="space-y-4 py-4 text-center">
            <div className="animate-pulse flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-pi-focus" />
              <p>Requesting camera and microphone access...</p>
            </div>
            
            {permissionError && (
              <div className="text-red-500 text-sm mt-2">
                {permissionError}
              </div>
            )}
          </div>
        )}
        
        {stage === 'ready' && (
          <div className="space-y-4 py-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 flex space-x-2">
                <div className="bg-black/50 rounded-full p-1.5">
                  <Video className="h-4 w-4 text-green-400" />
                </div>
                <div className="bg-black/50 rounded-full p-1.5">
                  <Mic className="h-4 w-4 text-green-400" />
                </div>
              </div>
            </div>
            
            <p className="text-sm text-center text-muted-foreground">
              Your camera and microphone are ready. Click "Go Live" to start your session.
            </p>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleStartSession}
                disabled={isLoading}
                className="bg-red-500 hover:bg-red-600"
              >
                {isLoading ? 'Starting...' : 'Go Live'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LiveSessionDialog;
