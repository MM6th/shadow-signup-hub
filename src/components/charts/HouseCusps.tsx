
import React from 'react';

interface HouseCuspsProps {
  houses: {
    house: number;
    sign: string;
    degree: number;
  }[];
}

const HouseCusps: React.FC<HouseCuspsProps> = ({ houses }) => {
  return (
    <div>
      <h3 className="text-xl font-elixia text-gradient mb-4">House Cusps</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {houses.map((house) => (
          <div key={house.house} className="p-3 bg-dark-secondary/30 rounded-lg text-center">
            <div className="text-lg font-medium">House {house.house}</div>
            <div className="text-sm text-pi-muted">{house.sign} {house.degree}°</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HouseCusps;
