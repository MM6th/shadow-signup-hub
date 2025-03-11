
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { MapPin, Clock, Briefcase, Tag, Star, PenSquare } from 'lucide-react';
import Button from '@/components/Button';
import AstrologyMessage from '@/components/AstrologyMessage';

const Dashboard: React.FC = () => {
  const { user, profile, isLoading, hasProfile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    } else if (!isLoading && user && !hasProfile) {
      navigate('/create-profile');
    }
  }, [user, isLoading, hasProfile, navigate]);

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

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-dark bg-dark-gradient text-pi py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-xl overflow-hidden">
          {/* Header section with photo and name */}
          <div className="relative">
            <div className="h-40 bg-gradient-to-r from-dark-accent to-pi-focus/30"></div>
            <div className="absolute top-24 left-8 rounded-full border-4 border-dark overflow-hidden">
              {profile.profile_photo_url ? (
                <img 
                  src={profile.profile_photo_url} 
                  alt={`${profile.first_name} ${profile.last_name}`} 
                  className="w-32 h-32 object-cover"
                />
              ) : (
                <div className="w-32 h-32 bg-dark-secondary flex items-center justify-center">
                  <span className="text-3xl text-pi-muted">
                    {profile.first_name[0]}{profile.last_name[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="h-24"></div>
          </div>
          
          {/* Profile content */}
          <div className="p-8">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-elixia text-gradient mb-2">
                  {profile.first_name} {profile.last_name}
                </h1>
                
                {profile.industry && (
                  <div className="flex items-center text-pi-muted">
                    <Tag size={16} className="mr-2" />
                    <span>{profile.industry}</span>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/create-profile')}
                className="flex items-center gap-2"
              >
                <PenSquare size={16} />
                Edit Profile
              </Button>
            </div>
            
            {/* Astrology Message */}
            {profile.zodiac_sign && profile.show_zodiac_sign && (
              <AstrologyMessage />
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-medium mb-3">Personal Details</h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="p-2 rounded-md bg-dark-secondary mr-3">
                        <Star size={18} className="text-pi-focus" />
                      </div>
                      <div>
                        <p className="text-sm text-pi-muted">Date of Birth</p>
                        <p className="text-pi">
                          {format(new Date(profile.date_of_birth), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    
                    {profile.zodiac_sign && profile.show_zodiac_sign && (
                      <div className="flex items-start">
                        <div className="p-2 rounded-md bg-dark-secondary mr-3">
                          <Star size={18} className="text-pi-focus" />
                        </div>
                        <div>
                          <p className="text-sm text-pi-muted">Zodiac Sign</p>
                          <p className="text-pi">{profile.zodiac_sign}</p>
                        </div>
                      </div>
                    )}
                    
                    {profile.time_of_birth && (
                      <div className="flex items-start">
                        <div className="p-2 rounded-md bg-dark-secondary mr-3">
                          <Clock size={18} className="text-pi-focus" />
                        </div>
                        <div>
                          <p className="text-sm text-pi-muted">Time of Birth</p>
                          <p className="text-pi">{profile.time_of_birth}</p>
                        </div>
                      </div>
                    )}
                    
                    {profile.place_of_birth && (
                      <div className="flex items-start">
                        <div className="p-2 rounded-md bg-dark-secondary mr-3">
                          <MapPin size={18} className="text-pi-focus" />
                        </div>
                        <div>
                          <p className="text-sm text-pi-muted">Place of Birth</p>
                          <p className="text-pi">{profile.place_of_birth}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-medium mb-3">Business Details</h2>
                  
                  <div className="space-y-3">
                    {profile.business_type && (
                      <div className="flex items-start">
                        <div className="p-2 rounded-md bg-dark-secondary mr-3">
                          <Briefcase size={18} className="text-pi-focus" />
                        </div>
                        <div>
                          <p className="text-sm text-pi-muted">Business Type</p>
                          <p className="text-pi">{profile.business_type}</p>
                        </div>
                      </div>
                    )}
                    
                    {profile.industry && (
                      <div className="flex items-start">
                        <div className="p-2 rounded-md bg-dark-secondary mr-3">
                          <Tag size={18} className="text-pi-focus" />
                        </div>
                        <div>
                          <p className="text-sm text-pi-muted">Industry</p>
                          <p className="text-pi">{profile.industry}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <Button variant="outline" onClick={() => navigate('/')}>
                Go to Home
              </Button>
              <Button variant="primary" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
