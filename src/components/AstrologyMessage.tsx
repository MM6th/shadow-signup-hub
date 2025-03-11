
import React from 'react';
import { useAstrologyMessage } from '@/hooks/useAstrologyMessage';
import { Sparkles, RefreshCw } from 'lucide-react';
import Button from './Button';

const AstrologyMessage: React.FC = () => {
  const { message, isLoading, error, refetch } = useAstrologyMessage();

  if (isLoading) {
    return (
      <div className="glass-card p-6 mb-8 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-pi-focus" />
          <h3 className="text-lg font-medium">Your Cosmic Insight</h3>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-dark-secondary rounded w-3/4"></div>
          <div className="h-4 bg-dark-secondary rounded w-full"></div>
          <div className="h-4 bg-dark-secondary rounded w-5/6"></div>
          <div className="h-4 bg-dark-secondary rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !message) {
    console.log('Error or no message to display:', error);
    return (
      <div className="glass-card p-6 mb-8 border-l-4 border-yellow-500">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-pi-focus" />
          <h3 className="text-lg font-medium">Your Cosmic Insight</h3>
        </div>
        <p className="text-pi-muted mb-4">
          We couldn't load your daily insight right now. Please try again later.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetch} 
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  console.log('Displaying message:', message);

  return (
    <div className="glass-card p-6 mb-8 border-l-4 border-pi-focus animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-pi-focus" />
          <h3 className="text-lg font-medium">Your Cosmic Insight</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={refetch} 
          className="h-8 w-8 p-0 rounded-full"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Refresh</span>
        </Button>
      </div>
      <div className="prose prose-invert prose-sm max-w-none">
        {message.split('\n\n').map((paragraph, index) => (
          <p key={index} className="mb-2 last:mb-0 text-pi-muted">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
};

export default AstrologyMessage;
