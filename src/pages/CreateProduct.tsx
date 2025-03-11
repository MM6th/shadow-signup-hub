
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductForm from '@/components/ProductForm';

const CreateProduct = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
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
          <p className="text-pi-muted">Add a new product or service to your cosmic marketplace.</p>
        </div>
        
        <ProductForm />
      </div>
    </div>
  );
};

export default CreateProduct;
