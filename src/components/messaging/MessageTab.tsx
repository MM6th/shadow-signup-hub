
import React, { useState, useEffect } from 'react';
import MessageList from './MessageList';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RefreshCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const MessageTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Refreshed",
      description: "Message list has been refreshed",
    });
  };
  
  // Force refresh initially to ensure users are loaded
  useEffect(() => {
    if (user) {
      // Log the current user ID for debugging
      console.log("Current user in MessageTab:", user.id);
      
      // Clear any possible stale data
      setRefreshKey(prev => prev + 1);
    }
  }, [user]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Private Messages</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          className="flex items-center gap-1"
        >
          <RefreshCcw size={16} />
          <span className="ml-1">Refresh</span>
        </Button>
      </div>
      
      <MessageList 
        selectedUserId={selectedUserId}
        onUserSelect={setSelectedUserId}
        key={refreshKey}
      />
    </div>
  );
};

export default MessageTab;
