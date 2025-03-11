
import React, { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import Button from '@/components/Button';
import AnimatedText from '@/components/AnimatedText';
import { Shield, Search, Eye, Lock } from 'lucide-react';

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading for a smoother mount animation
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleOpenAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark bg-dark-gradient text-pi">
      <NavBar onOpenAuthModal={handleOpenAuthModal} />
      
      {/* Hero Section */}
      <section className="relative flex flex-col justify-center min-h-screen pt-20 px-6">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-pi-focus/20 rounded-full filter blur-[100px] opacity-50"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-pi-focus/10 rounded-full filter blur-[120px] opacity-30"></div>
        </div>
        
        <div className="max-w-7xl mx-auto w-full z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1">
              <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
                <div className="inline-block px-4 py-1 bg-white/5 border border-white/10 rounded-full mb-6">
                  <p className="text-pi-accent text-sm font-medium">Professional & Confidential</p>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-elixia tracking-wider mb-6 leading-tight">
                  <span className="block text-gradient animate-text-shimmer">
                    Private Investigation
                  </span>
                  <span className="block text-gradient animate-text-shimmer bg-[length:200%_100%]">
                    Enterprises
                  </span>
                </h1>
                
                <AnimatedText
                  text="Specialized investigation services with the highest level of discretion, cutting-edge technology, and unmatched expertise."
                  className="text-pi-muted text-lg max-w-xl mb-8"
                  delay={300}
                  wordByWord
                />
                
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Button
                    size="lg"
                    onClick={() => handleOpenAuthModal('signup')}
                    className="group"
                  >
                    Get Started
                    <svg 
                      className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleOpenAuthModal('signin')}
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 flex justify-center">
              <div className={`relative w-full max-w-md aspect-square transition-all duration-1000 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="absolute inset-0 rounded-full bg-dark-gradient opacity-80 animate-pulse-subtle"></div>
                <div className="absolute inset-10 glass-card rounded-full animate-float">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <h2 className="text-3xl md:text-4xl font-elixia tracking-wider text-gradient mb-2">P.I.E</h2>
                      <p className="text-pi-muted text-sm">Established 2024</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <span className="text-pi-muted text-sm mb-2">Scroll to explore</span>
          <div className="w-0.5 h-16 bg-gradient-to-b from-white/20 to-transparent rounded-full">
            <div className="w-full h-4 bg-white/40 rounded-full animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-elixia mb-6 text-gradient">Our Services</h2>
            <p className="text-pi-muted max-w-2xl mx-auto">
              We provide comprehensive investigation services with discretion and professionalism.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Search size={32} />,
                title: "Background Checks",
                description: "Thorough verification of personal and professional histories."
              },
              {
                icon: <Eye size={32} />,
                title: "Surveillance",
                description: "Discreet monitoring and documentation of activities."
              },
              {
                icon: <Shield size={32} />,
                title: "Corporate Security",
                description: "Protecting businesses from internal and external threats."
              },
              {
                icon: <Lock size={32} />,
                title: "Digital Forensics",
                description: "Recovery and analysis of electronic data and evidence."
              }
            ].map((service, index) => (
              <div 
                key={index}
                className="glass-card p-8 rounded-xl transition-all hover:translate-y-[-5px] hover:bg-white/10"
              >
                <div className="text-pi-focus mb-4">{service.icon}</div>
                <h3 className="text-xl font-medium mb-3">{service.title}</h3>
                <p className="text-pi-muted">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 px-6 relative">
        <div className="absolute inset-0 bg-dark-accent/30"></div>
        <div className="max-w-3xl mx-auto relative z-10 glass-card rounded-2xl p-10 text-center">
          <h2 className="text-3xl font-elixia mb-6">Ready to get started?</h2>
          <p className="text-pi-muted mb-8 max-w-xl mx-auto">
            Join Private Investigation Enterprises today and access our full suite of investigative services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => handleOpenAuthModal('signup')}
            >
              Create Account
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleOpenAuthModal('signin')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </div>
  );
};

export default Index;
