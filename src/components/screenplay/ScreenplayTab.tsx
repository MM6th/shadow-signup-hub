
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const ScreenplayTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Screenplays</h2>
      </div>

      <Card>
        <CardContent className="p-6 text-center py-10">
          <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Screenplays</h3>
          <p className="text-gray-500">
            You don't have any screenplays created yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScreenplayTab;
