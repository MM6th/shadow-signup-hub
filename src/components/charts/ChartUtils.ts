import { Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune } from '@/components/icons/PlanetIcons';
import { supabase } from '@/integrations/supabase/client';

export const getZodiacSign = (index: number): string => {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 
    'Leo', 'Virgo', 'Libra', 'Scorpio', 
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  return signs[index];
};

export const getSignTraits = (index: number): string => {
  const traits = [
    'bold and pioneering',
    'grounded and determined',
    'curious and adaptable',
    'nurturing and intuitive',
    'confident and expressive',
    'analytical and precise',
    'balanced and diplomatic',
    'intense and transformative',
    'adventurous and philosophical',
    'disciplined and ambitious',
    'innovative and independent',
    'compassionate and imaginative'
  ];
  return traits[index];
};

export const generateDefaultReport = (chartData: any): string => {
  return `# ${chartData.chart_type.charAt(0).toUpperCase() + chartData.chart_type.slice(1)} Chart for ${chartData.client_name}
  
Birth Information:
- Date: ${new Date(chartData.birth_date).toLocaleDateString()}
- Time: ${chartData.birth_time}
- Location: ${chartData.birth_location}

Chart System: ${chartData.zodiac_type} zodiac with ${chartData.house_system} houses

## Overview
This astrological chart reveals key insights about ${chartData.client_name}'s personality, life path, and potential. The positions of celestial bodies at the time of birth create a unique energetic blueprint.

## Key Planetary Positions
(This section will be populated with the specific planetary positions from the chart calculation)

## Houses and Their Meanings
(This section will detail the houses and signs present in the natal chart)

## Major Aspects
(This section will analyze the significant planetary aspects)

## Interpretation
(The full interpretation will be provided based on the overall chart analysis)

Notes: ${chartData.notes || 'None provided'}`;
};

export const generateRealChartData = async (chartData: any, setPlanetaryPositions: any, setHouses: any, setAspects: any) => {
  try {
    const { data, error } = await supabase.functions.invoke('calculate-chart', {
      body: {
        birthDate: chartData.birth_date,
        birthTime: chartData.birth_time,
        latitude: chartData.latitude || 0,
        longitude: chartData.longitude || 0,
        location: chartData.birth_location,
        houseSystem: chartData.house_system,
        zodiacType: chartData.zodiac_type
      }
    });

    if (error) {
      console.error('Error fetching real chart data:', error);
      generateMockChartData(chartData, setPlanetaryPositions, setHouses, setAspects);
      return;
    }

    console.log('Received real astrological data:', data);

    const planets = [
      { name: 'Sun', icon: Sun },
      { name: 'Moon', icon: Moon },
      { name: 'Mercury', icon: Mercury },
      { name: 'Venus', icon: Venus },
      { name: 'Mars', icon: Mars },
      { name: 'Jupiter', icon: Jupiter },
      { name: 'Saturn', icon: Saturn },
      { name: 'Uranus', icon: Uranus },
      { name: 'Neptune', icon: Neptune }
    ];

    const realPlanetaryPositions = planets.map(planet => {
      const planetData = data.planets.find((p: any) => p.name.toLowerCase() === planet.name.toLowerCase());
      
      if (planetData) {
        return {
          name: planet.name,
          sign: planetData.sign,
          house: planetData.house,
          degree: parseFloat(planetData.degree.toFixed(2)),
          icon: planet.icon,
          description: `${planet.name} in ${planetData.sign} shapes ${getSignTraits(getZodiacSignIndex(planetData.sign))} qualities.`
        };
      }
      
      return {
        name: planet.name,
        sign: 'Unknown',
        house: 1,
        degree: 0,
        icon: planet.icon,
        description: `${planet.name} position could not be determined.`
      };
    });

    setPlanetaryPositions(realPlanetaryPositions);

    const realHouses = data.houses.map((house: any) => ({
      house: house.house,
      sign: house.sign,
      degree: parseFloat(house.degree.toFixed(2))
    }));

    setHouses(realHouses);

    const realAspects = data.aspects.map((aspect: any) => ({
      planet1: aspect.planet1,
      planet2: aspect.planet2,
      aspect: aspect.type,
      orb: parseFloat(aspect.orb.toFixed(2))
    }));

    setAspects(realAspects);
  } catch (error) {
    console.error('Exception during chart calculation:', error);
    generateMockChartData(chartData, setPlanetaryPositions, setHouses, setAspects);
  }
};

const getZodiacSignIndex = (sign: string): number => {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 
    'Leo', 'Virgo', 'Libra', 'Scorpio', 
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  
  return signs.findIndex(s => s.toLowerCase() === sign.toLowerCase());
};

export const generateMockChartData = (chartData: any, setPlanetaryPositions: any, setHouses: any, setAspects: any) => {
  const seed = chartData.id.charCodeAt(0) + chartData.birth_date.charCodeAt(0);
  
  const mockPlanets = [
    { 
      name: 'Sun', 
      sign: getZodiacSign(seed % 12), 
      house: (seed % 12) + 1, 
      degree: seed % 30, 
      icon: Sun,
      description: `The Sun in ${getZodiacSign(seed % 12)} suggests a personality that is ${getSignTraits(seed % 12)}.`
    },
    { 
      name: 'Moon', 
      sign: getZodiacSign((seed + 3) % 12), 
      house: ((seed + 3) % 12) + 1, 
      degree: (seed + 10) % 30, 
      icon: Moon,
      description: `The Moon in ${getZodiacSign((seed + 3) % 12)} indicates emotional patterns that are ${getSignTraits((seed + 3) % 12)}.`
    },
    { 
      name: 'Mercury', 
      sign: getZodiacSign((seed + 1) % 12), 
      house: ((seed + 1) % 12) + 1, 
      degree: (seed + 5) % 30, 
      icon: Mercury,
      description: `Mercury in ${getZodiacSign((seed + 1) % 12)} shapes a communication style that is ${getSignTraits((seed + 1) % 12)}.`
    },
    { 
      name: 'Venus', 
      sign: getZodiacSign((seed + 2) % 12), 
      house: ((seed + 2) % 12) + 1, 
      degree: (seed + 15) % 30, 
      icon: Venus,
      description: `Venus in ${getZodiacSign((seed + 2) % 12)} indicates love and values focused on being ${getSignTraits((seed + 2) % 12)}.`
    },
    { 
      name: 'Mars', 
      sign: getZodiacSign((seed + 4) % 12), 
      house: ((seed + 4) % 12) + 1, 
      degree: (seed + 20) % 30, 
      icon: Mars,
      description: `Mars in ${getZodiacSign((seed + 4) % 12)} gives an energy and drive that is ${getSignTraits((seed + 4) % 12)}.`
    },
    { 
      name: 'Jupiter', 
      sign: getZodiacSign((seed + 5) % 12), 
      house: ((seed + 5) % 12) + 1, 
      degree: (seed + 25) % 30, 
      icon: Jupiter,
      description: `Jupiter in ${getZodiacSign((seed + 5) % 12)} brings expansion and growth through ${getSignTraits((seed + 5) % 12)} qualities.`
    },
    { 
      name: 'Saturn', 
      sign: getZodiacSign((seed + 6) % 12), 
      house: ((seed + 6) % 12) + 1, 
      degree: (seed + 8) % 30, 
      icon: Saturn,
      description: `Saturn in ${getZodiacSign((seed + 6) % 12)} creates structure and discipline in ${getSignTraits((seed + 6) % 12)} areas.`
    },
    { 
      name: 'Uranus', 
      sign: getZodiacSign((seed + 7) % 12), 
      house: ((seed + 7) % 12) + 1, 
      degree: (seed + 12) % 30, 
      icon: Uranus,
      description: `Uranus in ${getZodiacSign((seed + 7) % 12)} brings revolutionary changes through ${getSignTraits((seed + 7) % 12)} approaches.`
    },
    { 
      name: 'Neptune', 
      sign: getZodiacSign((seed + 8) % 12), 
      house: ((seed + 8) % 12) + 1, 
      degree: (seed + 18) % 30, 
      icon: Neptune,
      description: `Neptune in ${getZodiacSign((seed + 8) % 12)} dissolves boundaries through ${getSignTraits((seed + 8) % 12)} ideals.`
    }
  ];
  
  setPlanetaryPositions(mockPlanets);
  
  const mockHouses = Array.from({ length: 12 }, (_, i) => ({
    house: i + 1,
    sign: getZodiacSign((seed + i) % 12),
    degree: ((seed + i * 3) % 30)
  }));
  
  setHouses(mockHouses);
  
  const mockAspects = [
    { planet1: 'Sun', planet2: 'Moon', aspect: 'Conjunction', orb: 2.1 },
    { planet1: 'Mercury', planet2: 'Venus', aspect: 'Trine', orb: 0.5 },
    { planet1: 'Mars', planet2: 'Saturn', aspect: 'Square', orb: 1.3 },
    { planet1: 'Jupiter', planet2: 'Sun', aspect: 'Opposition', orb: 3.2 },
    { planet1: 'Venus', planet2: 'Neptune', aspect: 'Sextile', orb: 0.8 }
  ];
  
  setAspects(mockAspects);
};
