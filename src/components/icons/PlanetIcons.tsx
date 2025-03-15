
import React from 'react';

// Base component for all planet icons to ensure consistent styling
const PlanetIcon = ({ 
  children, 
  size = 24, 
  className = ""
}: { 
  children: React.ReactNode; 
  size?: number;
  className?: string;
}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`lucide lucide-planet ${className}`}
  >
    {children}
  </svg>
);

export const Sun = ({ size = 24, className = "" }) => (
  <PlanetIcon size={size} className={className}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </PlanetIcon>
);

export const Moon = ({ size = 24, className = "" }) => (
  <PlanetIcon size={size} className={className}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </PlanetIcon>
);

export const Mercury = ({ size = 24, className = "" }) => (
  <PlanetIcon size={size} className={className}>
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="7" r="1" />
    <line x1="12" y1="21" x2="12" y2="16" />
    <path d="M9 9 h6" />
  </PlanetIcon>
);

export const Venus = ({ size = 24, className = "" }) => (
  <PlanetIcon size={size} className={className}>
    <circle cx="12" cy="8" r="5" />
    <line x1="12" y1="13" x2="12" y2="21" />
    <line x1="9" y1="18" x2="15" y2="18" />
  </PlanetIcon>
);

export const Mars = ({ size = 24, className = "" }) => (
  <PlanetIcon size={size} className={className}>
    <circle cx="10" cy="12" r="5" />
    <line x1="15" y1="7" x2="20" y2="2" />
    <line x1="15" y1="2" x2="20" y2="2" />
    <line x1="20" y1="2" x2="20" y2="7" />
  </PlanetIcon>
);

export const Jupiter = ({ size = 24, className = "" }) => (
  <PlanetIcon size={size} className={className}>
    <path d="M4 14 h6" />
    <path d="M4 10 h16" />
    <path d="M10 18 V6" />
  </PlanetIcon>
);

export const Saturn = ({ size = 24, className = "" }) => (
  <PlanetIcon size={size} className={className}>
    <ellipse cx="12" cy="12" rx="8" ry="3" />
    <line x1="5" y1="9" x2="19" y2="15" />
  </PlanetIcon>
);

export const Uranus = ({ size = 24, className = "" }) => (
  <PlanetIcon size={size} className={className}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="7" x2="12" y2="17" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <circle cx="12" cy="4" r="1" />
  </PlanetIcon>
);

export const Neptune = ({ size = 24, className = "" }) => (
  <PlanetIcon size={size} className={className}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <path d="M12 17 l4 4" />
    <path d="M12 17 l-4 4" />
  </PlanetIcon>
);
