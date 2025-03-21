
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Play, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LivestreamType, isStreamActive } from '@/components/livestream/types';

interface LivestreamCardProps {
  stream: LivestreamType;
  onDelete: (streamId: string) => void;
}

const LivestreamCard: React.FC<LivestreamCardProps> = ({ stream, onDelete }) => {
  const navigate = useNavigate();
  const active = isStreamActive(stream);

  const handleJoinLivestream = (conferenceId: string) => {
    navigate(`/livestream/${conferenceId}`);
  };

  console.log('Stream status check:', {
    id: stream.id,
    title: stream.title,
    is_active: stream.is_active,
    ended_at: stream.ended_at,
    isActiveResult: active
  });

  return (
    <Card key={stream.id} className="overflow-hidden">
      <div className="aspect-video bg-gray-100 relative">
        {stream.thumbnail_url ? (
          <img 
            src={stream.thumbnail_url} 
            alt={stream.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <Video className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {active && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            Live
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-medium text-lg mb-2">{stream.title}</h3>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Views: {stream.views || 0}</span>
          <span>
            {active
              ? 'Started ' + formatDistanceToNow(new Date(stream.created_at), { addSuffix: true })
              : 'Ended ' + formatDistanceToNow(new Date(stream.ended_at || stream.created_at), { addSuffix: true })
            }
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button 
          className="flex-1 mr-2" 
          onClick={() => handleJoinLivestream(stream.conference_id)}
        >
          {active ? (
            <>Join</>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Play Recording
            </>
          )}
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Livestream</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this livestream? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(stream.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default LivestreamCard;
