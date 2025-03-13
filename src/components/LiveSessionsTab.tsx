
import React from 'react';
import { useLiveSessions } from '@/hooks/useLiveSessions';
import LiveSessionCard from './LiveSessionCard';
import { Video } from 'lucide-react';

const LiveSessionsTab: React.FC = () => {
  const { liveSessions, isLoading } = useLiveSessions();
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card h-24 animate-pulse" />
        ))}
      </div>
    );
  }
  
  if (liveSessions.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <Video className="mx-auto h-12 w-12 text-pi-muted mb-2" />
        <h3 className="text-lg font-medium mb-1">No Live Sessions</h3>
        <p className="text-pi-muted">
          There are no active live sessions at the moment.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {liveSessions.map((session) => (
        <LiveSessionCard key={session.id} session={session} />
      ))}
    </div>
  );
};

export default LiveSessionsTab;
