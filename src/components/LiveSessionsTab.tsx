
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Plus, Video } from 'lucide-react';
import LiveSessionCard from './LiveSessionCard';
import LiveSessionDialog from './LiveSessionDialog';
import { useLiveSessions } from '@/hooks/useLiveSessions';

interface LiveSessionsTabProps {
  userId?: string;
}

const LiveSessionsTab: React.FC<LiveSessionsTabProps> = ({ userId }) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const { liveSessions, userLiveSession, isLoading } = useLiveSessions();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gradient">Live Sessions</h2>
        <Button 
          size="sm" 
          onClick={() => setIsDialogOpen(true)}
          disabled={!!userLiveSession}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Go Live</span>
        </Button>
      </div>

      {userLiveSession && (
        <div className="mb-6 glass-card p-4 border border-green-500/20">
          <h3 className="text-lg font-medium mb-2 text-green-400">Your Active Session</h3>
          <LiveSessionCard session={userLiveSession} isOwner={true} />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((_, i) => (
            <div key={i} className="glass-card h-40 animate-pulse" />
          ))}
        </div>
      ) : liveSessions.filter(session => !userId || session.user_id !== userId).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liveSessions
            .filter(session => !userId || session.user_id !== userId) // Filter out user's own session if userId provided
            .map((session) => (
              <LiveSessionCard key={session.id} session={session} />
            ))}
        </div>
      ) : (
        <div className="glass-card p-6 text-center">
          <Video className="h-12 w-12 mx-auto text-pi-muted mb-3" />
          <h3 className="text-lg font-medium mb-2">No Live Sessions</h3>
          <p className="text-pi-muted mb-4">
            There are currently no active live sessions from other users.
          </p>
          <Button size="sm" onClick={() => setIsDialogOpen(true)} disabled={!!userLiveSession}>
            Start a Live Session
          </Button>
        </div>
      )}

      <LiveSessionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default LiveSessionsTab;
