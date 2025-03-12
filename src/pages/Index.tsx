
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import AnimatedText from '../components/AnimatedText';
import FeaturedServices from '../components/FeaturedServices';
import AuthModal from '../components/AuthModal';
import AgeVerificationModal from '../components/AgeVerificationModal';
import { useSellerReviews } from '../hooks/useReviews';
import { supabase } from '@/integrations/supabase/client';

const ADMIN_ID = '3a25fea8-ec60-4e52-ae40-63f2b1ce89d9'; // Admin user ID

const Index: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const { reviews, isLoading, averageRating, totalReviews } = useSellerReviews(ADMIN_ID);
  
  const handleOpenAuthModal = (mode: 'signin' | 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Get rounded rating for display (e.g., 4.7 -> 5)
  const displayRating = Math.round(averageRating);

  return (
    <div className="min-h-screen flex flex-col bg-dark">
      <AgeVerificationModal />
      
      <NavBar onOpenAuthModal={handleOpenAuthModal} />
      
      <div className="flex-1">
        {/* Hero section */}
        <section className="relative pt-20 pb-32 bg-dark-gradient px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-elixia mb-6 text-white">
                  <AnimatedText text="Private Investigation" />
                  <span className="block text-gradient mt-2">
                    <AnimatedText text="Enterprises" delay={0.5} />
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-pi-muted mb-8 max-w-xl leading-relaxed">
                  Discover a digital ecosystem where entrepreneurs, influencers, and knowledge workers
                  connect, collaborate, and create new economic opportunities.
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" onClick={() => handleOpenAuthModal('signup')}>
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => handleOpenAuthModal('signin')}>
                    Sign In
                  </Button>
                </div>
                
                <div className="flex items-center mt-8">
                  <div className="flex -space-x-2">
                    {reviews.slice(0, 4).map((review, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-dark overflow-hidden">
                        {review.profile_photo_url ? (
                          <img 
                            src={review.profile_photo_url} 
                            alt="User" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/5"></div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i <= displayRating ? 'text-amber-400 fill-amber-400' : 'text-gray-400'}`} 
                        />
                      ))}
                    </div>
                    <p className="text-sm text-pi-muted">
                      {totalReviews > 0 
                        ? `Trusted by ${totalReviews} user${totalReviews !== 1 ? 's' : ''}` 
                        : 'Be the first to leave a review!'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-pi-focus/30 to-purple-600/30 rounded-lg blur-3xl opacity-30"></div>
                  <div className="relative glass-card rounded-xl overflow-hidden border border-white/10">
                    <img 
                      src="/placeholder.svg" 
                      alt="Private Investigation Enterprises Platform" 
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Featured services section */}
        <FeaturedServices />
        
        {/* CTA section */}
        <section className="py-20 px-4 bg-dark-secondary">
          <div className="container mx-auto max-w-5xl text-center">
            <h2 className="text-3xl md:text-4xl font-elixia mb-6 text-gradient">
              Ready to Elevate Your Business?
            </h2>
            <p className="text-lg text-pi-muted mb-8 max-w-2xl mx-auto">
              Join our platform and unlock a world of opportunities for your services.
              Connect with clients, collaborate with peers, and grow your business.
            </p>
            <Button size="lg" onClick={() => handleOpenAuthModal('signup')}>
              Join P.I.E Today <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      </div>
      
      <Footer />
      
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </div>
  );
};

export default Index;
