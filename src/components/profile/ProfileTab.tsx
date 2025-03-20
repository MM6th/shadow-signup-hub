
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { User, Edit } from 'lucide-react';

const ProfileTab: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Profile</h2>
        <Button 
          variant="outline"
          onClick={() => navigate('/update-profile')}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                {profile?.profile_photo_url ? (
                  <img 
                    src={profile.profile_photo_url} 
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={48} className="text-gray-400" />
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">{profile?.username || 'Anonymous User'}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Business Type</p>
                  <p className="font-medium">{profile?.business_type || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Industry</p>
                  <p className="font-medium">{profile?.industry || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="default"
                  onClick={() => navigate('/marketplace')}
                >
                  Go to Marketplace
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin-nft')}
                >
                  Admin NFT Marketplace
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileTab;
