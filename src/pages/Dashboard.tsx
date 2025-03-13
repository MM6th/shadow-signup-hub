
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Video } from 'lucide-react';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useUserSession } from '@/hooks/useUserSession';
import { useProduct } from '@/hooks/useProduct';
import ProductCard from '@/components/ProductCard';
import AppointmentManager from '@/components/AppointmentManager';
import LiveSessionDialog from '@/components/LiveSessionDialog';
import { useLiveSessions } from '@/hooks/useLiveSessions';
import LiveSessionsTab from '@/components/LiveSessionsTab';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useUserSession();
  const { products, isLoading, fetchProducts } = useProduct();
  const { userLiveSession } = useLiveSessions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    fetchProducts();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-pi-focus">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ''} />
              <AvatarFallback>{user.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-elixia text-gradient">
                Welcome, {user.user_metadata?.username || user.email?.split('@')[0] || 'User'}!
              </h1>
              <p className="text-pi-muted">Manage your products, appointments, and live sessions</p>
            </div>
          </div>
          <Button onClick={() => navigate('/marketplace')} className="ml-auto">
            Go to Marketplace
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="live-sessions">Live Sessions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gradient">Your Products</h2>
              <Button onClick={() => navigate('/create-product')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Product
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                <>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="glass-card p-4 h-64 animate-pulse" />
                  ))}
                </>
              ) : products.filter(product => product.user_id === user.id).length > 0 ? (
                products.filter(product => product.user_id === user.id).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="glass-card p-6 text-center">
                  <h3 className="text-lg font-medium mb-2">No Products Yet</h3>
                  <p className="text-pi-muted">
                    Start selling your products by creating one.
                  </p>
                  <Button onClick={() => navigate('/create-product')}>
                    Create Product
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="appointments">
            <AppointmentManager />
          </TabsContent>

          <TabsContent value="live-sessions">
            <LiveSessionsTab userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
