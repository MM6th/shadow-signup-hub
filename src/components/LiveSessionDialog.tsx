
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLiveSessions } from '@/hooks/useLiveSessions';
import { useToast } from '@/hooks/use-toast';

interface LiveSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LiveSessionDialog: React.FC<LiveSessionDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [title, setTitle] = useState('');
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const { startLiveSession, isLoading } = useLiveSessions();
  const { toast } = useToast();

  // Request camera permissions before starting the session
  const requestMediaPermissions = async (): Promise<boolean> => {
    setIsRequestingPermissions(true);
    
    try {
      console.log('Requesting camera and microphone permissions...');
      // First try to access the camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      console.log('Permissions granted, stream obtained:', stream);
      
      // If we've gotten this far, permissions were granted
      // Clean up the stream we just created
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      
      setIsRequestingPermissions(false);
      return true;
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      toast({
        title: 'Permission Error',
        description: 'Camera and microphone access is required for live sessions. Please enable permissions and try again.',
        variant: 'destructive',
      });
      
      setIsRequestingPermissions(false);
      return false;
    }
  };

  const handleStartSession = async () => {
    if (!title.trim()) return;
    
    console.log('Starting session flow...');
    
    // First request permissions
    const permissionsGranted = await requestMediaPermissions();
    
    if (!permissionsGranted) {
      console.log('Permissions not granted, stopping session creation');
      return;
    }
    
    console.log('Permissions granted, creating session with title:', title);
    
    // Then start the session
    const session = await startLiveSession(title);
    
    if (session) {
      console.log('Session created successfully:', session);
      // Close the dialog
      onOpenChange(false);
      
      // Reset the form
      setTitle('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Live Session</DialogTitle>
          <DialogDescription>
            Start a live video session that will be visible to others in the marketplace
          </DialogDescription>
        </DialogHeader>
        
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
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleStartSession}
            disabled={!title.trim() || isLoading || isRequestingPermissions}
          >
            {isRequestingPermissions ? 'Requesting Permissions...' : 
             isLoading ? 'Starting...' : 'Go Live'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LiveSessionDialog;
