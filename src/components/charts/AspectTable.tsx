
import React from 'react';

interface AspectTableProps {
  aspects: {
    planet1: string;
    planet2: string;
    aspect: string;
    orb: number;
  }[];
}

const AspectTable: React.FC<AspectTableProps> = ({ aspects }) => {
  return (
    <div>
      <h3 className="text-xl font-elixia text-gradient mb-4">Major Aspects</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-dark-accent">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Planets</th>
              <th className="px-4 py-2 text-left">Aspect</th>
              <th className="px-4 py-2 text-left">Orb</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-accent">
            {aspects.map((aspect, idx) => (
              <tr key={idx}>
                <td className="px-4 py-2">{aspect.planet1} - {aspect.planet2}</td>
                <td className="px-4 py-2">{aspect.aspect}</td>
                <td className="px-4 py-2">{aspect.orb}°</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AspectTable;
