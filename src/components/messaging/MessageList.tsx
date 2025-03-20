
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { User, Send, Link, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_name?: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface UserData {
  id: string;
  username?: string;
  email?: string;
}

// Define a type for Supabase auth user
interface SupabaseAuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    email?: string;
  };
}

interface MessageListProps {
  selectedUserId?: string;
  onUserSelect?: (userId: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ 
  selectedUserId, 
  onUserSelect 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Fetch all users except current user - now including those without profiles
  const fetchUsers = async () => {
    if (!user) return;
    
    try {
      setLoadingUsers(true);
      console.log("Fetching users...");
      
      // First get profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .neq('id', user.id);
        
      if (profilesError) throw profilesError;
      
      // Then get all auth users
      const { data: authUsersResponse, error: authUsersError } = await supabase.auth.admin.listUsers();
      
      if (authUsersError) {
        console.log("Cannot access auth users list, using only profiles data");
        setUsers(profilesData || []);
      } else {
        // Combine data, prioritizing profile usernames but including users without profiles
        const combinedUsers: UserData[] = [];
        
        // Map of user IDs we've already added
        const addedUserIds = new Set<string>();
        
        // Add users with profiles first
        profilesData?.forEach(profile => {
          combinedUsers.push(profile);
          addedUserIds.add(profile.id);
        });
        
        // Add auth users that don't have profiles
        const authUsers = authUsersResponse?.users as SupabaseAuthUser[] || [];
        authUsers.forEach(authUser => {
          if (authUser.id !== user.id && !addedUserIds.has(authUser.id)) {
            combinedUsers.push({
              id: authUser.id,
              email: authUser.email || authUser.user_metadata?.email,
              username: authUser.email?.split('@')[0] || 'User'
            });
          }
        });
        
        setUsers(combinedUsers);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Could not load users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };
  
  // Subscribe to message events
  useEffect(() => {
    if (!user) return;
    
    const setupSubscription = async () => {
      console.log("Setting up message subscription for user:", user.id);
      
      // Check for any unread messages first
      const { data: unreadMessages, error: unreadError } = await supabase
        .from('messages')
        .select('id, sender_id, sender_name')
        .eq('receiver_id', user.id)
        .eq('is_read', false);
        
      if (unreadError) {
        console.error("Error checking unread messages:", unreadError);
      } else if (unreadMessages?.length) {
        console.log(`You have ${unreadMessages.length} unread messages`);
        
        // Group by sender
        const unreadBySender = new Map();
        unreadMessages.forEach(msg => {
          const count = unreadBySender.get(msg.sender_id) || 0;
          unreadBySender.set(msg.sender_id, count + 1);
        });
        
        // Notify user about unread messages
        unreadBySender.forEach((count, senderId) => {
          const senderName = unreadMessages.find(m => m.sender_id === senderId)?.sender_name || 'Someone';
          toast({
            title: "Unread messages",
            description: `You have ${count} unread message(s) from ${senderName}`,
          });
        });
      }
      
      // Subscribe to new messages
      const channel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`
          },
          (payload) => {
            // Only update if the message is from the currently selected user
            if (payload.new.sender_id === selectedUserId) {
              fetchMessages();
            } else {
              // Show toast for new message from other user
              toast({
                title: "New message",
                description: `You have a new message from ${payload.new.sender_name || 'a user'}`,
              });
            }
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    setupSubscription();
  }, [user, selectedUserId, toast]);
  
  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, [user]);
  
  // Load messages when selected user changes
  useEffect(() => {
    if (selectedUserId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [selectedUserId]);
  
  // Fetch messages for selected user
  const fetchMessages = async () => {
    if (!user || !selectedUserId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${selectedUserId},receiver_id.eq.${selectedUserId}`)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Filter messages to only show those between the current user and selected user
      const filteredMessages = data?.filter(msg => 
        (msg.sender_id === user.id && msg.receiver_id === selectedUserId) || 
        (msg.sender_id === selectedUserId && msg.receiver_id === user.id)
      ) || [];
      
      setMessages(filteredMessages);
      
      // Mark unread messages as read
      const unreadMessages = filteredMessages.filter(
        msg => !msg.is_read && msg.receiver_id === user.id
      );
      
      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map(msg => 
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', msg.id)
          )
        );
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Could not load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Send new message
  const sendMessage = async () => {
    if (!user || !selectedUserId || !newMessage.trim()) return;
    
    try {
      // Get sender profile to include the username
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
        
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedUserId,
          sender_name: profileData?.username || user.email?.split('@')[0] || 'User',
          content: newMessage,
          is_read: false
        });
        
      if (error) throw error;
      
      setNewMessage('');
      fetchMessages(); // Refresh messages
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Could not send message",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col rounded-lg glass-card">
      <div className="grid grid-cols-1 md:grid-cols-3 h-full min-h-[400px]">
        {/* Users list */}
        <div className="border-r border-dark-accent/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Users</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchUsers}
              disabled={loadingUsers}
            >
              <RefreshCcw size={16} className={loadingUsers ? "animate-spin" : ""} />
            </Button>
          </div>
          
          <ScrollArea className="h-[350px]">
            {users.length === 0 ? (
              <div className="text-center py-8 text-pi-muted">
                {loadingUsers ? (
                  <div className="animate-spin h-6 w-6 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-2"></div>
                ) : (
                  "No users found"
                )}
              </div>
            ) : (
              <ul className="space-y-2">
                {users.map(u => (
                  <li 
                    key={u.id}
                    className={`
                      p-2 rounded-md cursor-pointer flex items-center
                      ${selectedUserId === u.id ? 'bg-pi-focus/20' : 'hover:bg-dark-accent/10'}
                    `}
                    onClick={() => onUserSelect && onUserSelect(u.id)}
                  >
                    <div className="h-8 w-8 rounded-full bg-dark-secondary flex items-center justify-center mr-3">
                      <User size={16} className="text-pi-muted" />
                    </div>
                    <span>{u.username || u.email?.split('@')[0] || 'User'}</span>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>
        
        {/* Messages area */}
        <div className="col-span-2 flex flex-col h-full">
          {selectedUserId ? (
            <>
              <div className="p-4 border-b border-dark-accent/30">
                <h3 className="text-lg font-medium">
                  {users.find(u => u.id === selectedUserId)?.username || 'User'}
                </h3>
              </div>
              
              <ScrollArea className="flex-grow p-4 h-[300px]">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-6 w-6 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-pi-muted">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-pi-muted">
                    <p>No messages yet</p>
                    <p className="text-sm">Send a message to start the conversation</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div 
                        key={message.id}
                        className={`
                          flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}
                        `}
                      >
                        <div 
                          className={`
                            max-w-[70%] p-3 rounded-lg
                            ${message.sender_id === user?.id 
                              ? 'bg-pi-focus/30 text-white' 
                              : 'bg-dark-secondary text-pi'}
                          `}
                        >
                          {/* Detect if content is a link to a livestream */}
                          {message.content.includes('/livestream/') ? (
                            <div>
                              <div className="flex items-center text-xs mb-2">
                                <Link size={14} className="mr-1" />
                                <span>Livestream Link</span>
                              </div>
                              <p className="break-all">{message.content}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 w-full"
                                onClick={() => window.open(message.content, '_blank')}
                              >
                                Join Stream
                              </Button>
                            </div>
                          ) : (
                            <p>{message.content}</p>
                          )}
                          <div className="text-right mt-1">
                            <span className="text-xs opacity-70">
                              {new Date(message.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              <div className="p-4 border-t border-dark-accent/30">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow"
                  />
                  <Button type="submit" disabled={!newMessage.trim()}>
                    <Send size={16} />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-pi-muted">
              <div className="text-center">
                <User size={48} className="mx-auto mb-4" />
                <p>Select a user to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageList;
