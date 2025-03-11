
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DigitalOffice: React.FC = () => {
  const { user, profile, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Loading your digital office...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark bg-dark-gradient">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              {profile.profile_photo_url ? (
                <img 
                  src={profile.profile_photo_url} 
                  alt={`${profile.first_name} ${profile.last_name}`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-pi-focus"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-dark-secondary flex items-center justify-center border-2 border-pi-focus">
                  <span className="text-2xl text-pi-muted">
                    {profile.first_name[0]}{profile.last_name[0]}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-elixia text-gradient">
                  {profile.first_name} {profile.last_name}
                </h1>
                {profile.show_zodiac_sign && profile.zodiac_sign && (
                  <p className="text-pi-muted">{profile.zodiac_sign}</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={signOut}
              className="flex items-center gap-2"
            >
              <LogOut size={18} />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalOffice;
