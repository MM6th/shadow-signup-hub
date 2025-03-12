
import React from 'react';
import { RefreshCw } from 'lucide-react';
import Button from './Button';

const AstrologyMessage: React.FC = () => {
  return (
    <div className="glass-card p-6 mb-8 border-l-4 border-pi-focus animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Daily Insight</h3>
        </div>
      </div>
      <div className="prose prose-invert prose-sm max-w-none">
        <p className="mb-2 last:mb-0 text-pi-muted">
          We're updating our daily insights feature. Check back soon for personalized daily messages.
        </p>
      </div>
    </div>
  );
};

export default AstrologyMessage;
