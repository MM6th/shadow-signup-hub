
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLiveSessions } from '@/hooks/useLiveSessions';

interface LiveSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LiveSessionDialog: React.FC<LiveSessionDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [title, setTitle] = useState('');
  const { startLiveSession, isLoading } = useLiveSessions();

  const handleStartSession = async () => {
    if (!title.trim()) return;
    
    const session = await startLiveSession(title);
    
    if (session) {
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
            disabled={!title.trim() || isLoading}
          >
            {isLoading ? 'Starting...' : 'Go Live'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LiveSessionDialog;
