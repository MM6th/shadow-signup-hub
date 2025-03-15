
import React from 'react';

interface ChartLoaderProps {
  message?: string;
}

const ChartLoader: React.FC<ChartLoaderProps> = ({ message = 'Loading chart data...' }) => {
  return (
    <div className="min-h-screen bg-dark bg-dark-gradient flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-pi-muted">{message}</p>
      </div>
    </div>
  );
};

export default ChartLoader;
