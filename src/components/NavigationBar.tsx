
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const Navbar: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <nav className="bg-pi-secondary py-4 border-b border-pi-accent">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="text-white text-xl font-bold font-elixia">
          Cosmic Platform
        </Link>
        
        <div className="flex space-x-4">
          <Link to="/marketplace">
            <Button variant="ghost">Marketplace</Button>
          </Link>
          
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link to="/digital-office">
                <Button variant="ghost">Digital Office</Button>
              </Link>
            </>
          ) : (
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
