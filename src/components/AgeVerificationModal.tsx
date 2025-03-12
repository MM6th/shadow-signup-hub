
import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const AgeVerificationModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    // Check if the user has already verified their age
    const hasVerifiedAge = localStorage.getItem('age-verified');
    
    if (!hasVerifiedAge) {
      // Show the modal if the user hasn't verified their age yet
      setIsOpen(true);
    }
  }, []);
  
  const handleAccept = () => {
    // Store the verification in localStorage
    localStorage.setItem('age-verified', 'true');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="glass-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Age Verification Required
          </DialogTitle>
          <DialogDescription className="pt-2">
            You must be 18 years or older to access this website.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-pi text-sm">
            By continuing to use this website, you confirm that you are at least 18 years of age.
            This website may contain content suitable only for adults.
          </p>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleAccept} 
            className="w-full"
          >
            I am 18 or older - Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgeVerificationModal;
