
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LiveSession, useLiveSessions } from '@/hooks/useLiveSessions';
import { formatDistanceToNow } from 'date-fns';
import { Video, Radio } from 'lucide-react';

interface LiveSessionCardProps {
  session: LiveSession;
}

const LiveSessionCard: React.FC<LiveSessionCardProps> = ({ session }) => {
  const { joinLiveSession } = useLiveSessions();
  const timeAgo = formatDistanceToNow(new Date(session.started_at), { addSuffix: true });
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-10 w-10 border border-primary/10">
            <AvatarImage src={session.profile_photo_url || ''} alt={session.username || 'User'} />
            <AvatarFallback>{session.username ? getInitials(session.username) : 'U'}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{session.title}</h3>
              <div className="flex items-center space-x-1 text-red-500">
                <Radio className="h-3 w-3 animate-pulse" />
                <span className="text-xs font-medium">LIVE</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              {session.username || 'Anonymous'}
            </p>
            
            <p className="text-xs text-gray-400">
              Started {timeAgo}
            </p>
            
            <div className="pt-2">
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => joinLiveSession(session.room_id)}
              >
                <Video className="h-4 w-4 mr-2" />
                Join Stream
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveSessionCard;
