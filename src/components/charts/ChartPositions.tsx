
import React from 'react';
import PlanetaryPositions from './PlanetaryPositions';
import HouseCusps from './HouseCusps';
import AspectTable from './AspectTable';

interface Planet {
  name: string;
  sign: string;
  house: number;
  degree: number;
  icon: React.ElementType;
  description: string;
}

interface ChartPositionsProps {
  planetaryPositions: Planet[];
  houses: {
    house: number;
    sign: string;
    degree: number;
  }[];
  aspects: {
    planet1: string;
    planet2: string;
    aspect: string;
    orb: number;
  }[];
}

const ChartPositions: React.FC<ChartPositionsProps> = ({ 
  planetaryPositions,
  houses,
  aspects
}) => {
  return (
    <div className="space-y-6">
      <PlanetaryPositions planetaryPositions={planetaryPositions} />
      <HouseCusps houses={houses} />
      <AspectTable aspects={aspects} />
    </div>
  );
};

export default ChartPositions;
