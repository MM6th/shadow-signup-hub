
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductForm from '@/components/ProductForm';
import { useToast } from '@/hooks/use-toast';

const CreateProduct = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paypalClientId, setPaypalClientId] = useState('');
  
  const ADMIN_EMAIL = "cmooregee@gmail.com";
  const isAdminUser = user?.email === ADMIN_EMAIL;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    // Redirect to login if not authenticated
    navigate('/');
    return null;
  }
  
  if (!isAdminUser) {
    toast({
      title: "Access restricted",
      description: "Only administrators can create products",
      variant: "destructive",
    });
    navigate('/marketplace');
    return null;
  }
  
  const handlePaypalClientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaypalClientId(e.target.value);
  };
  
  return (
    <div className="min-h-screen bg-dark bg-dark-gradient text-pi py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center mb-4 text-pi-muted hover:text-pi"
          >
            <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-elixia text-gradient">Create New Product</h1>
          <p className="text-pi-muted mb-6">Add a new product or service to your cosmic marketplace.</p>
        </div>
        
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-elixia text-gradient mb-4">PayPal Integration</h2>
          <p className="text-pi-muted mb-4">Enter your PayPal Client ID to enable PayPal payments for all products.</p>
          
          <div className="mb-4">
            <label htmlFor="paypal-client-id" className="block text-sm font-medium mb-1">
              PayPal Client ID
            </label>
            <input
              id="paypal-client-id"
              type="text"
              value={paypalClientId}
              onChange={handlePaypalClientIdChange}
              placeholder="Enter your PayPal Client ID"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-pi-muted mt-1">
              This will be used for all products in your marketplace.
            </p>
          </div>
        </div>
        
        <ProductForm paypalClientId={paypalClientId} />
      </div>
    </div>
  );
};

export default CreateProduct;
