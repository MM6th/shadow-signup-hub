
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import NavBar from '@/components/NavBar'; 
import AnimatedText from '@/components/AnimatedText';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AgeVerificationModal from '@/components/AgeVerificationModal';

const Index: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const hasVerifiedAge = localStorage.getItem('ageVerified');
    if (!hasVerifiedAge) {
      setIsAgeModalOpen(true);
    }
  }, []);

  const handleAgeVerification = () => {
    localStorage.setItem('ageVerified', 'true');
    setIsAgeModalOpen(false);
  };

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <NavBar onOpenAuthModal={openAuthModal} />

      <main className="relative">
        <section className="py-24 md:py-32 bg-gradient-to-b from-dark-secondary to-dark overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1">
                <AnimatedText
                  text="Empowering Creators, Connecting Communities"
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
                />
                <p className="text-pi-muted text-lg mb-8">
                  Join a vibrant ecosystem where creators thrive and communities flourish.
                  Discover new opportunities, collaborate with like-minded individuals,
                  and bring your ideas to life.
                </p>
                <Button size="lg" onClick={() => openAuthModal('signup')}>
                  Get Started <ArrowRight className="ml-2" />
                </Button>
              </div>

              <div className="order-1 md:order-2 relative">
                <motion.img
                  src="/hero-image.png"
                  alt="Hero Image"
                  className="max-w-full rounded-lg shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-semibold text-white text-center mb-12">
              Our Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="glass-card p-6 text-center animate-delayed" style={{ '--delay': '1' } as React.CSSProperties}>
                <h3 className="text-xl font-medium text-gradient mb-3">Consultations</h3>
                <p className="text-pi-muted">
                  Connect with experts for personalized advice and guidance.
                </p>
              </div>
              <div className="glass-card p-6 text-center animate-delayed" style={{ '--delay': '2' } as React.CSSProperties}>
                <h3 className="text-xl font-medium text-gradient mb-3">Live Sessions</h3>
                <p className="text-pi-muted">
                  Engage in real-time interactions and collaborative experiences.
                </p>
              </div>
              <div className="glass-card p-6 text-center animate-delayed" style={{ '--delay': '3' } as React.CSSProperties}>
                <h3 className="text-xl font-medium text-gradient mb-3">Product Marketplace</h3>
                <p className="text-pi-muted">
                  Discover and sell unique products within our community.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-16 md:py-24 bg-dark-secondary">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-semibold text-white text-center mb-12">
              About Us
            </h2>
            <div className="glass-card p-8 md:p-12">
              <p className="text-pi-muted text-lg">
                We are a community-driven platform dedicated to empowering creators and
                fostering meaningful connections. Our mission is to provide the tools and
                resources you need to succeed in today's digital landscape.
              </p>
              <ul className="list-disc list-inside text-pi-muted mt-6">
                <li>Connect with experts and peers</li>
                <li>Showcase and sell your products</li>
                <li>Participate in live events and workshops</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="contact" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-semibold text-white text-center mb-12">
              Contact Us
            </h2>
            <div className="glass-card p-8 md:p-12 text-center">
              <p className="text-pi-muted text-lg mb-6">
                Have questions or need assistance? Reach out to our team for support.
              </p>
              <Button variant="outline">Contact Support</Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        defaultMode={authMode}
      />

      <AgeVerificationModal
        isOpen={isAgeModalOpen}
        onVerify={handleAgeVerification}
      />
    </div>
  );
};

export default Index;
