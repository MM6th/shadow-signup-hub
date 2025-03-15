
import React from 'react';

interface ChartVisualProps {
  chart: any;
}

const ChartVisual: React.FC<ChartVisualProps> = ({ chart }) => {
  return (
    <div>
      <div className="aspect-square max-w-xl mx-auto relative rounded-full overflow-hidden border-2 border-pi-focus border-t-transparent bg-dark-accent/30 mb-8">
        {/* Placeholder for the wheel chart - would be replaced with actual chart visualization */}
        <div className="absolute inset-0 flex items-center justify-center text-pi-muted">
          Chart visualization would be rendered here
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <h3 className="text-xl font-elixia text-gradient">Chart Info</h3>
          <div className="space-y-1 text-sm">
            <p>Type: <span className="text-pi capitalize">{chart.chart_type}</span></p>
            <p>System: <span className="text-pi capitalize">{chart.zodiac_type}</span></p>
            <p>Houses: <span className="text-pi capitalize">{chart.house_system}</span></p>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-elixia text-gradient">Subject</h3>
          <div className="space-y-1 text-sm">
            <p>Name: <span className="text-pi">{chart.client_name}</span></p>
            <p>Birth Date: <span className="text-pi">{new Date(chart.birth_date).toLocaleDateString()}</span></p>
            <p>Birth Time: <span className="text-pi">{chart.birth_time}</span></p>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-elixia text-gradient">Location</h3>
          <div className="space-y-1 text-sm">
            <p>Place: <span className="text-pi">{chart.birth_location}</span></p>
            {chart.latitude && chart.longitude && (
              <>
                <p>Lat: <span className="text-pi">{chart.latitude}°</span></p>
                <p>Long: <span className="text-pi">{chart.longitude}°</span></p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartVisual;
