
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import ProfileForm from '@/components/ProfileForm';

const UpdateProfile: React.FC = () => {
  const { user, profile, isLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
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
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
        </div>
        
        <Card className="glass-card">
          <CardHeader>
            <h1 className="text-3xl font-elixia text-gradient">Update Your Profile</h1>
            <p className="text-pi-muted">
              Edit your profile information to keep your details up to date.
            </p>
          </CardHeader>
          
          <CardContent>
            {profile ? (
              <ProfileForm 
                userId={user.id} 
                profile={profile}
                onSuccess={handleSuccess}
                isCreate={false}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-pi-muted">Profile not found. Creating a new profile is required.</p>
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="mt-4"
                >
                  Return to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdateProfile;
