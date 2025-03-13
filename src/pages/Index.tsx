
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
                  <AnimatedText text="Private Investigation" permanent={true} />
                  <span className="block text-gradient mt-2">
                    <AnimatedText text="Enterprises" delay={0.5} permanent={true} />
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
                  <div className="relative glass-card rounded-xl overflow-hidden border border-white/10 flex items-center justify-center p-8">
                    {/* Animated P.I.E. Circle */}
                    <div className="relative w-80 h-80">
                      {/* Outer rotating ring */}
                      <div className="absolute inset-0 rounded-full border-4 border-pi-focus/30 animate-[spin_30s_linear_infinite]"></div>
                      
                      {/* Middle rotating ring with symbols */}
                      <div className="absolute inset-4 rounded-full border-2 border-purple-500/40 animate-[spin_20s_linear_infinite_reverse]">
                        {/* Celestial symbols */}
                        {[...Array(12)].map((_, i) => (
                          <div 
                            key={i}
                            className="absolute w-3 h-3 bg-white/70 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                            style={{
                              left: '50%',
                              top: '50%',
                              transform: `rotate(${i * 30}deg) translateY(-40px) rotate(${-i * 30}deg)`,
                            }}
                          ></div>
                        ))}
                      </div>
                      
                      {/* Inner rotating ring */}
                      <div className="absolute inset-12 rounded-full border border-cyan-400/50 animate-[spin_15s_linear_infinite]"></div>
                      
                      {/* Center stable P.I.E. logo */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-gradient-to-br from-pi-focus to-purple-600 w-36 h-36 rounded-full flex items-center justify-center text-white font-elixia text-4xl shadow-lg shadow-pi-focus/20">
                          P.I.E.
                        </div>
                      </div>
                      
                      {/* Particles */}
                      {[...Array(20)].map((_, i) => (
                        <div 
                          key={i}
                          className="absolute w-1 h-1 bg-white/60 rounded-full animate-ping"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${1 + Math.random() * 3}s`,
                          }}
                        ></div>
                      ))}
                    </div>
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
              Ready to bring your above below?
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
