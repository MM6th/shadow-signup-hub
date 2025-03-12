
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Clock, Baby, Briefcase, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string;
  type: string;
};

const FeaturedServices: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch products from the database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setFeaturedProducts(data as Product[]);
        } else {
          // Fallback to default products if no products in database
          setFeaturedProducts([
            {
              id: '1',
              title: 'Career Based on Astrological Findings',
              description: 'Discover your perfect career path through cosmic guidance and astrological insights.',
              price: 499.99,
              image_url: '/placeholder.svg',
              category: 'consulting',
              type: 'service'
            },
            {
              id: '2',
              title: 'Parenting Based on Astrological Findings',
              description: 'Learn how to nurture your children based on their astrological charts and cosmic energy.',
              price: 299.99,
              image_url: '/placeholder.svg',
              category: 'consulting',
              type: 'service'
            },
            {
              id: '3',
              title: 'Financial Security',
              description: 'Secure your financial future with cosmic insights and astrological timing.',
              price: 699.99,
              image_url: '/placeholder.svg',
              category: 'consulting',
              type: 'service'
            }
          ]);
        }
      } catch (error: any) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error loading featured services",
          description: "Could not load featured services. Using default data instead.",
          variant: "destructive",
        });
        
        // Fallback to default products on error
        setFeaturedProducts([
          {
            id: '1',
            title: 'Career Based on Astrological Findings',
            description: 'Discover your perfect career path through cosmic guidance and astrological insights.',
            price: 499.99,
            image_url: '/placeholder.svg',
            category: 'consulting',
            type: 'service'
          },
          {
            id: '2',
            title: 'Parenting Based on Astrological Findings',
            description: 'Learn how to nurture your children based on their astrological charts and cosmic energy.',
            price: 299.99,
            image_url: '/placeholder.svg',
            category: 'consulting',
            type: 'service'
          },
          {
            id: '3',
            title: 'Financial Security',
            description: 'Secure your financial future with cosmic insights and astrological timing.',
            price: 699.99,
            image_url: '/placeholder.svg',
            category: 'consulting',
            type: 'service'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [toast]);

  const handleNext = () => {
    setActiveIndex((current) => (current === featuredProducts.length - 1 ? 0 : current + 1));
  };

  const handlePrev = () => {
    setActiveIndex((current) => (current === 0 ? featuredProducts.length - 1 : current - 1));
  };

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Get the appropriate icon for a service
  const getIconForService = (title: string) => {
    if (title.toLowerCase().includes('career')) return Briefcase;
    if (title.toLowerCase().includes('parent')) return Baby;
    if (title.toLowerCase().includes('financial')) return DollarSign;
    // Default icon
    return Star;
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 h-96 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-0 overflow-hidden mb-10 relative group">
      <div className="relative h-96">
        {featuredProducts.map((product, index) => {
          const Icon = getIconForService(product.title);
          
          return (
            <div
              key={product.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <div className="h-full w-full relative">
                <div className="absolute inset-0 bg-gradient-to-r from-dark to-transparent z-10" />
                <img
                  src={product.image_url || '/placeholder.svg'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 z-20 flex items-center p-8">
                  <div className="max-w-2xl">
                    <div className="bg-pi-focus/20 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                      Featured Service
                    </div>
                    <h2 className="text-3xl font-elixia text-gradient mb-2">{product.title}</h2>
                    <p className="text-pi-muted mb-4 max-w-xl">{product.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 fill-yellow-500 text-yellow-500 mr-1" />
                        <span className="text-white">5.0</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-pi-muted mr-1" />
                        <span className="text-pi-muted">60 minutes</span>
                      </div>
                      <div className="text-2xl font-medium text-white">
                        ${product.price.toFixed(2)}
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
          );
        })}
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
        {featuredProducts.map((_, index) => (
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
