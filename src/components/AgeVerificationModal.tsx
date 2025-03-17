
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

// Helper to clear age verification (can be used in development)
// Uncomment this line to reset the age verification on page load
// localStorage.removeItem('age-verified');

const AgeVerificationModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    // Force clear age verification in development if needed
    // localStorage.removeItem('age-verified');
    
    // Check if the user has already verified their age
    const hasVerifiedAge = localStorage.getItem('age-verified');
    
    if (!hasVerifiedAge) {
      // Show the modal if the user hasn't verified their age yet
      setIsOpen(true);
    }
    
    // For debugging
    console.log("AgeVerificationModal mounted, hasVerifiedAge:", hasVerifiedAge, "isOpen:", isOpen);
  }, []);
  
  const handleAccept = () => {
    // Store the verification in localStorage
    localStorage.setItem('age-verified', 'true');
    setIsOpen(false);
    console.log("Age verification accepted");
  };

  const handleReject = () => {
    // If the user is under 18, redirect them away from the site
    console.log("Age verification rejected, redirecting...");
    window.location.href = 'https://www.google.com';
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
          <p className="text-sm">
            By continuing to use this website, you confirm that you are at least 18 years of age.
            This website may contain content suitable only for adults.
          </p>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button 
            variant="outline"
            onClick={handleReject} 
            className="w-full sm:w-auto"
          >
            I am under 18
          </Button>
          <Button 
            onClick={handleAccept} 
            className="w-full sm:w-auto"
          >
            I am 18 or older - Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgeVerificationModal;
