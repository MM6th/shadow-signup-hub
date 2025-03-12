
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User } from 'lucide-react';

const businessTypes = [
  'Sole Proprietorship',
  'Limited Liability Company (LLC)',
  'Corporation',
  'Partnership',
  'Non-profit',
  'Freelancer',
  'Other'
];

const industries = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Retail',
  'Manufacturing',
  'Entertainment',
  'Real Estate',
  'Consulting',
  'Marketing',
  'Legal',
  'Art & Design',
  'Wellness & Health',
  'Spirituality',
  'Astrology',
  'Other'
];

const UpdateProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, refreshProfile } = useProfile(user?.id);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBusinessType(profile.business_type || null);
      setIndustry(profile.industry || null);
      setProfilePhotoUrl(profile.profile_photo_url || null);
    }
  }, [profile]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to update your profile.",
        variant: "destructive",
      });
      return;
    }
    
    if (!username.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter a username.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          business_type: businessType,
          industry,
          profile_photo_url: profilePhotoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Refresh the profile to get the updated data
      await refreshProfile();
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `profile_photos/${fileName}`;
    
    try {
      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
      
      if (data) {
        setProfilePhotoUrl(data.publicUrl);
      }
    } catch (error: any) {
      console.error('Error uploading profile photo:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile photo. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Loading your profile...</p>
        </div>
      </div>
    );
  }
  
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-dark-accent bg-dark-secondary flex items-center justify-center">
                    {profilePhotoUrl ? (
                      <img 
                        src={profilePhotoUrl} 
                        alt={username} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-pi-muted" />
                    )}
                  </div>
                  
                  <div>
                    <label 
                      htmlFor="profile-photo" 
                      className="inline-block cursor-pointer px-4 py-2 bg-dark-secondary hover:bg-dark-accent transition-colors rounded-md text-sm font-medium"
                    >
                      Change Photo
                    </label>
                    <input 
                      type="file" 
                      id="profile-photo" 
                      accept="image/*" 
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-pi-muted mt-1">
                      JPG, PNG or GIF. Maximum size 2MB.
                    </p>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-1">
                  <label htmlFor="username" className="block text-sm font-medium">
                    Username *
                  </label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="bg-dark-secondary border-dark-accent"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="business-type" className="block text-sm font-medium">
                      Business Type
                    </label>
                    <Select 
                      value={businessType || ''} 
                      onValueChange={setBusinessType}
                    >
                      <SelectTrigger className="bg-dark-secondary border-dark-accent">
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {businessTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <label htmlFor="industry" className="block text-sm font-medium">
                      Industry
                    </label>
                    <Select 
                      value={industry || ''} 
                      onValueChange={setIndustry}
                    >
                      <SelectTrigger className="bg-dark-secondary border-dark-accent">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {industries.map((ind) => (
                          <SelectItem key={ind} value={ind}>
                            {ind}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full md:w-auto"
                >
                  {isSubmitting ? "Updating..." : "Update Profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdateProfile;
