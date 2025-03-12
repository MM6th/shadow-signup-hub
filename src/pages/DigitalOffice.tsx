
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button';
import { User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DigitalOffice = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-dark bg-dark-gradient text-pi p-4">
      <div className="max-w-7xl mx-auto pt-20">
        <div className="glass-card p-8 rounded-xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-dark-secondary flex items-center justify-center">
              {profile?.profile_photo_url ? (
                <img 
                  src={profile.profile_photo_url} 
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={48} className="text-pi-muted" />
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-elixia mb-2">
                {profile?.username || 'User'}
              </h1>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {profile?.business_type && (
                  <div className="bg-dark-secondary px-3 py-1 rounded-full text-sm">
                    {profile.business_type}
                  </div>
                )}
                
                {profile?.industry && (
                  <div className="bg-pi-focus/20 text-pi-focus px-3 py-1 rounded-full text-sm">
                    {profile.industry}
                  </div>
                )}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleSignOut}
            >
              <LogOut size={16} />
              Sign Out
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-xl">
              <h2 className="text-xl mb-4">Digital Office</h2>
              <p className="text-pi-muted">Your digital workspace is being set up. Check back soon!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalOffice;
