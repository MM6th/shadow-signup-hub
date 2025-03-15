
import React from 'react';

interface Planet {
  name: string;
  sign: string;
  house: number;
  degree: number;
  icon: React.ElementType;
  description: string;
}

interface PlanetaryPositionsProps {
  planetaryPositions: Planet[];
}

const PlanetaryPositions: React.FC<PlanetaryPositionsProps> = ({ planetaryPositions }) => {
  return (
    <div>
      <h3 className="text-xl font-elixia text-gradient mb-4">Planetary Positions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {planetaryPositions.map((planet) => {
          const PlanetIcon = planet.icon;
          return (
            <div key={planet.name} className="flex items-start p-3 bg-dark-secondary/30 rounded-lg">
              <div className="mr-3">
                <PlanetIcon size={24} className="text-pi-focus" />
              </div>
              <div>
                <h4 className="font-medium">{planet.name}</h4>
                <div className="text-sm text-pi-muted">
                  <p>{planet.sign} {planet.degree}° (House {planet.house})</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlanetaryPositions;
