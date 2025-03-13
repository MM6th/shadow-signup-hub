
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import SignInForm from './SignInForm';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

export interface AuthModalProps {
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
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Set the mode when the defaultMode prop changes
    setMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    // If user is authenticated and modal is open, close it and redirect
    if (user && isOpen) {
      onClose();
      navigate('/dashboard');
      toast({
        title: "Welcome",
        description: "You've been signed in successfully.",
      });
    }
  }, [user, isOpen, onClose, navigate]);

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
