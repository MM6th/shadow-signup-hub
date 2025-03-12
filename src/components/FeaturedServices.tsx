
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Clock, Baby, Briefcase, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Updated featured services with new descriptions
const featuredServices = [
  {
    id: '1',
    title: 'Career Based on Astrological Findings',
    description: 'Discover your perfect career path through cosmic guidance and astrological insights.',
    price: 499.99,
    image: '/placeholder.svg',
    rating: 4.9,
    duration: '90 minutes',
    icon: Briefcase
  },
  {
    id: '2',
    title: 'Parenting Based on Astrological Findings',
    description: 'Learn how to nurture your children based on their astrological charts and cosmic energy.',
    price: 299.99,
    image: '/placeholder.svg',
    rating: 5.0,
    duration: '3 hours',
    icon: Baby
  },
  {
    id: '3',
    title: 'Financial Security',
    description: 'Secure your financial future with cosmic insights and astrological timing.',
    price: 699.99,
    image: '/placeholder.svg',
    rating: 4.8,
    duration: '2 hours',
    icon: DollarSign
  }
];

const FeaturedServices: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    setActiveIndex((current) => (current === featuredServices.length - 1 ? 0 : current + 1));
  };

  const handlePrev = () => {
    setActiveIndex((current) => (current === 0 ? featuredServices.length - 1 : current - 1));
  };

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-0 overflow-hidden mb-10 relative group">
      <div className="relative h-96">
        {featuredServices.map((service, index) => (
          <div
            key={service.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div className="h-full w-full relative">
              <div className="absolute inset-0 bg-gradient-to-r from-dark to-transparent z-10" />
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 z-20 flex items-center p-8">
                <div className="max-w-2xl">
                  <div className="bg-pi-focus/20 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                    Featured Service
                  </div>
                  <h2 className="text-3xl font-elixia text-gradient mb-2">{service.title}</h2>
                  <p className="text-pi-muted mb-4 max-w-xl">{service.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 fill-yellow-500 text-yellow-500 mr-1" />
                      <span className="text-white">{service.rating}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-pi-muted mr-1" />
                      <span className="text-pi-muted">{service.duration}</span>
                    </div>
                    <div className="text-2xl font-medium text-white">
                      ${service.price.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="space-x-3">
                    <Button size="lg">Learn More</Button>
                    <Button size="lg" variant="outline">Book Now</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Navigation buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-30 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-30 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
      
      {/* Indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-30">
        {featuredServices.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`h-2 w-8 rounded-full transition-colors ${
              index === activeIndex ? 'bg-pi-focus' : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedServices;
