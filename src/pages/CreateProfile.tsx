
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white bg-transparent border-white/20 hover:bg-white/10"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Button>
        </div>
        
        <Card className="bg-gray-800/80 border border-gray-700 shadow-xl text-white">
          <CardHeader className="border-b border-gray-700 pb-4">
            <h1 className="text-3xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              Create Your Profile
            </h1>
            <p className="text-gray-300 mt-2">
              Complete your profile information to get started with Private Investigation Enterprises.
            </p>
          </CardHeader>
          
          <CardContent className="pt-6">
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
