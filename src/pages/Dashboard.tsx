
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductsTab from '@/components/products/ProductsTab';
import LivestreamTab from '@/components/livestream/LivestreamTab';
import { Card, CardContent } from '@/components/ui/card';
import { ADMIN_IDS } from '@/hooks/useUserSession';

// Simple placeholder component for the profile tab
const ProfileTab = () => {
  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
      <p className="text-gray-500">Your profile information will appear here.</p>
    </div>
  );
};

// Simple placeholder component for the appointment tab
const AppointmentTab = () => {
  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Appointments</h2>
      <p className="text-gray-500">Your appointment management will appear here.</p>
    </div>
  );
};

// Simple placeholder component for the chart tab
const ChartTab = () => {
  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Charts</h2>
      <p className="text-gray-500">Your chart data will appear here.</p>
    </div>
  );
};

// Simple placeholder component for the screenplay tab
const ScreenplayTab = () => {
  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Screenplays</h2>
      <p className="text-gray-500">Your screenplay data will appear here.</p>
    </div>
  );
};

// Simple placeholder component for the video tab
const VideoTab = () => {
  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Videos</h2>
      <p className="text-gray-500">Your video content will appear here.</p>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Check if user is admin
  const isAdmin = user ? ADMIN_IDS.includes(user.id) : false;
  
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-3xl font-semibold mb-6">Dashboard</h1>
      
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-8 overflow-x-auto flex-wrap">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="products">My Products</TabsTrigger>
              {isAdmin && (
                <>
                  <TabsTrigger value="livestream">Livestreams</TabsTrigger>
                  <TabsTrigger value="appointments">Appointments</TabsTrigger>
                  <TabsTrigger value="charts">Charts</TabsTrigger>
                  <TabsTrigger value="screenplay">Screenplay</TabsTrigger>
                  <TabsTrigger value="videos">Videos</TabsTrigger>
                </>
              )}
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6">
              <ProfileTab />
            </TabsContent>
            
            <TabsContent value="products" className="space-y-6">
              <ProductsTab isAdmin={isAdmin} />
            </TabsContent>
            
            {isAdmin && (
              <>
                <TabsContent value="livestream" className="space-y-6">
                  <LivestreamTab />
                </TabsContent>
                
                <TabsContent value="appointments" className="space-y-6">
                  <AppointmentTab />
                </TabsContent>
                
                <TabsContent value="charts" className="space-y-6">
                  <ChartTab />
                </TabsContent>
                
                <TabsContent value="screenplay" className="space-y-6">
                  <ScreenplayTab />
                </TabsContent>
                
                <TabsContent value="videos" className="space-y-6">
                  <VideoTab />
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
