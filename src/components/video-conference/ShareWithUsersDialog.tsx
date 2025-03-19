
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, User, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ShareWithUsersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
}

const ShareWithUsersDialog: React.FC<ShareWithUsersProps> = ({
  open,
  onOpenChange,
  shareUrl,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{[key: string]: boolean}>({});
  
  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || !open) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username')
          .neq('id', user.id);
          
        if (error) throw error;
        setUsers(data || []);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Could not load users",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [user, open, toast]);
  
  // Toggle user selection
  const toggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };
  
  // Send message to selected users
  const handleSend = async () => {
    if (!user || selectedUsers.length === 0) return;
    
    try {
      setSending(true);
      
      // Get sender profile to include the username
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      
      // Send message to each selected user
      const newSent = { ...sent };
      
      for (const receiverId of selectedUsers) {
        const { error } = await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            sender_name: profileData?.username || 'User',
            content: shareUrl,
            is_read: false
          });
          
        if (error) {
          console.error('Error sending message:', error);
          toast({
            title: "Error",
            description: `Could not send link to ${users.find(u => u.id === receiverId)?.username || 'user'}`,
            variant: "destructive",
          });
        } else {
          newSent[receiverId] = true;
        }
      }
      
      setSent(newSent);
      
      toast({
        title: "Link shared",
        description: `Livestream link has been shared with ${selectedUsers.length} user(s)`,
      });
      
      // Close dialog after short delay
      if (Object.keys(newSent).length === selectedUsers.length) {
        setTimeout(() => {
          onOpenChange(false);
          setSent({});
          setSelectedUsers([]);
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error sharing link:', error);
      toast({
        title: "Error",
        description: "Could not share the livestream link",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Livestream</DialogTitle>
          <DialogDescription>
            Share this livestream with other users on the platform
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <h3 className="text-sm font-medium mb-2">Select Users:</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-6 w-6 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-pi-muted">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-4 text-pi-muted">No other users found</p>
          ) : (
            <ScrollArea className="h-[200px]">
              <ul className="space-y-2">
                {users.map(u => {
                  const isSelected = selectedUsers.includes(u.id);
                  const isSent = sent[u.id];
                  
                  return (
                    <li 
                      key={u.id}
                      className={`
                        p-2 rounded-md cursor-pointer flex items-center justify-between
                        ${isSelected ? 'bg-pi-focus/20' : 'hover:bg-dark-accent/10'}
                      `}
                      onClick={() => !isSent && toggleUser(u.id)}
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-dark-secondary flex items-center justify-center mr-3">
                          <User size={16} className="text-pi-muted" />
                        </div>
                        <span>{u.username || 'User'}</span>
                      </div>
                      
                      {isSent ? (
                        <CheckCircle size={18} className="text-green-500" />
                      ) : isSelected ? (
                        <div className="h-4 w-4 rounded-full bg-pi-focus"></div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSent({});
              setSelectedUsers([]);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={selectedUsers.length === 0 || sending}
            className="flex items-center"
          >
            {sending ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            ) : (
              <Send size={16} className="mr-2" />
            )}
            Share with {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareWithUsersDialog;
