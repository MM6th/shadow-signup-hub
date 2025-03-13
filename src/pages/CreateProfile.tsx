
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ProfileForm from '@/components/ProfileForm';

const CreateProfile: React.FC = () => {
  const { user, profile, refreshProfile, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/');
      } else if (profile) {
        navigate('/dashboard');
      }
    }
  }, [user, profile, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Loading your profile...</p>
        </div>
      </div>
    );
  }
  
  if (!user || profile) return null;
  
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
