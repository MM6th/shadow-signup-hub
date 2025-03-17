
import React from 'react';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={cn("py-10 px-6 bg-dark-secondary border-t border-white/5", className)}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h3 className="text-xl font-elixia mb-4 text-pi">Private Investigation Enterprises</h3>
            <p className="text-pi-muted max-w-xs">
              Professional investigation services with discretion, integrity, and results.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-4 text-pi">Contact Us</h4>
            <ul className="space-y-2 text-pi-muted">
              <li>153-70 S Conduit Avenue</li>
              <li>Jamaica, NY 11434</li>
              <li>617-580-2869</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center">
          <p className="text-pi-muted text-sm">
            &copy; {currentYear} Private Investigation Enterprises. All rights reserved.
          </p>
          
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-pi-muted hover:text-pi transition-colors">
              Terms
            </a>
            <a href="#" className="text-pi-muted hover:text-pi transition-colors">
              Privacy
            </a>
            <a href="#" className="text-pi-muted hover:text-pi transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
