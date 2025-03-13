
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import ProfileForm from '@/components/ProfileForm';

const CreateProfile: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  if (!user) {
    navigate('/');
    return null;
  }
  
  const handleSuccess = async () => {
    await refreshProfile();
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen bg-dark bg-dark-gradient text-pi py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Button>
        </div>
        
        <Card className="glass-card">
          <CardHeader>
            <h1 className="text-3xl font-elixia text-gradient">Create Your Profile</h1>
            <p className="text-pi-muted">
              Complete your profile information to get started with Private Investigation Enterprises.
            </p>
          </CardHeader>
          
          <CardContent>
            <ProfileForm 
              userId={user.id} 
              profile={null}
              onSuccess={handleSuccess}
              isCreate={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateProfile;
