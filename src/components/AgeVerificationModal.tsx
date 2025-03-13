
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onVerify: () => void;
}

const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({ isOpen, onVerify }) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="glass-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Age Verification</DialogTitle>
          <DialogDescription className="text-pi-muted">
            This platform contains content intended for adults. Please confirm that you are at least 18 years of age.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4">
          <p className="text-white mb-2">
            By clicking "I Confirm" below, you confirm that:
          </p>
          <ul className="list-disc list-inside text-pi-muted space-y-1 pl-2">
            <li>You are at least 18 years old</li>
            <li>You have read and agree to our Terms of Service</li>
            <li>You accept our use of cookies and privacy policy</li>
          </ul>
        </div>
        
        <DialogFooter>
          <Button 
            variant="default" 
            onClick={onVerify} 
            className="w-full"
          >
            I Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgeVerificationModal;
