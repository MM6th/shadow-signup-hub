
import React, { useState, useEffect } from 'react';
import Button from './Button';
import { Menu, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface NavBarProps {
  onOpenAuthModal: (mode: 'signin' | 'signup') => void;
}

const NavBar: React.FC<NavBarProps> = ({ onOpenAuthModal }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleProfileClick = () => {
    navigate('/dashboard');
    setIsMenuOpen(false);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 px-6 md:px-10",
        isScrolled ? "backdrop-blur-xl bg-dark/80 shadow-md" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <a href="/" className="text-pi text-xl font-medium font-elixia tracking-wider">
            P.I.E
          </a>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          <a href="#services" className="text-pi-muted hover:text-pi transition-colors">
            Services
          </a>
          <a href="#about" className="text-pi-muted hover:text-pi transition-colors">
            About
          </a>
          <a href="#contact" className="text-pi-muted hover:text-pi transition-colors">
            Contact
          </a>
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <Button 
                variant="ghost" 
                onClick={handleProfileClick}
                className="flex items-center space-x-2"
              >
                {profile?.profile_photo_url ? (
                  <img 
                    src={profile.profile_photo_url} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <User size={18} />
                )}
                <span>Profile</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={() => onOpenAuthModal('signin')}
              >
                Sign In
              </Button>
              <Button 
                variant="primary"
                onClick={() => onOpenAuthModal('signup')}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden text-pi"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 backdrop-blur-xl bg-dark/95 border-t border-white/10 animate-fade-in">
          <div className="py-4 px-6 space-y-4">
            <a 
              href="#services" 
              className="block py-2 text-pi-muted hover:text-pi transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </a>
            <a 
              href="#about" 
              className="block py-2 text-pi-muted hover:text-pi transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </a>
            <a 
              href="#contact" 
              className="block py-2 text-pi-muted hover:text-pi transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </a>
            <div className="pt-4 flex flex-col space-y-3">
              {user ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleProfileClick}
                    className="flex items-center justify-center space-x-2"
                  >
                    {profile?.profile_photo_url ? (
                      <img 
                        src={profile.profile_photo_url} 
                        alt="Profile" 
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <User size={16} />
                    )}
                    <span>Profile</span>
                  </Button>
                  <Button 
                    variant="primary"
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      onOpenAuthModal('signin');
                      setIsMenuOpen(false);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="primary"
                    onClick={() => {
                      onOpenAuthModal('signup');
                      setIsMenuOpen(false);
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;
