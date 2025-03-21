
import React from 'react';
import { Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const EmptyState: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-6 text-center py-10">
        <Video className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Livestreams</h3>
        <p className="text-gray-500">
          You haven't created any livestreams yet.
        </p>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
