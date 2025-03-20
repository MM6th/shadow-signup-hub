
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Video } from 'lucide-react';

const VideoTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Videos</h2>
      </div>

      <Card>
        <CardContent className="p-6 text-center py-10">
          <Video className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Videos</h3>
          <p className="text-gray-500">
            You don't have any videos uploaded yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoTab;
