
import React, { useState } from 'react';
import MessageList from './MessageList';

const MessageTab: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Private Messages</h2>
      </div>
      
      <MessageList 
        selectedUserId={selectedUserId}
        onUserSelect={setSelectedUserId}
      />
    </div>
  );
};

export default MessageTab;
