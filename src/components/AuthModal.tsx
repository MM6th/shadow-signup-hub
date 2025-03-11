
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import SignInForm from './SignInForm';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  defaultMode = 'signin'
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const { user, hasProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated and modal is open, close it and redirect
    if (user && isOpen) {
      onClose();
      if (!hasProfile) {
        navigate('/create-profile');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, isOpen, onClose, navigate, hasProfile]);

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-card sm:max-w-md p-0 border-none">
        <div className="relative p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-pi-muted hover:text-pi transition-colors rounded-full p-1 hover:bg-white/5"
          >
            <X size={20} />
          </button>
          
          <SignInForm 
            mode={mode} 
            onToggleMode={toggleMode} 
            onClose={onClose} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
