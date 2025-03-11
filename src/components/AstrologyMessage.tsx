
import React from 'react';
import { useAstrologyMessage } from '@/hooks/useAstrologyMessage';
import { Sparkles } from 'lucide-react';

const AstrologyMessage: React.FC = () => {
  const { message, isLoading } = useAstrologyMessage();

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

  if (!message) {
    return null;
  }

  return (
    <div className="glass-card p-6 mb-8 border-l-4 border-pi-focus animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-pi-focus" />
        <h3 className="text-lg font-medium">Your Cosmic Insight</h3>
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
