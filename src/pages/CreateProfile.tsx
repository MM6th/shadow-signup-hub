
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
    <div className="min-h-screen bg-dark bg-dark-gradient flex items-center justify-center py-10 px-4">
      <Card className="glass-card w-full max-w-2xl">
        <CardHeader>
          <h1 className="text-3xl font-elixia text-gradient">Create Your Profile</h1>
          <p className="text-pi-muted">
            Set up your profile to get started with P.I.E. This information helps us
            personalize your experience and connect you with the right opportunities.
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
  );
};

export default CreateProfile;
