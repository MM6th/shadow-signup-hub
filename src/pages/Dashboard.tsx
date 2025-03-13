import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Video, User } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from '@/components/ProductCard';
import { AppointmentManager } from '@/components/AppointmentManager';
import { LiveSessionDialog } from '@/components/LiveSessionDialog';
import { useLiveSessions } from '@/hooks/useLiveSessions';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveDialogOpen, setIsLiveDialogOpen] = useState(false);
  const { userLiveSession } = useLiveSessions();
  
  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id);
        
        if (productsError) throw productsError;
        setProducts(productsData || []);
        
        const { data: purchasesData, error: purchasesError } = await supabase
          .from('products')
          .select('*')
          .eq('buyer_id', user.id);
        
        if (purchasesError) throw purchasesError;
        setPurchases(purchasesData || []);
        
        const { data: salesData, error: salesError } = await supabase
          .from('products')
          .select('*')
          .eq('seller_id', user.id);
        
        if (salesError) throw salesError;
        setSales(salesData || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: 'Error fetching products',
          description: 'Failed to load your products. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, [user, toast]);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      console.error('Sign out failed:', error);
      toast({
        title: 'Error signing out',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  if (!user) {
    return <div className="min-h-screen bg-dark text-white flex items-center justify-center">
      Loading...
    </div>;
  }
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <div className="min-h-screen bg-dark">
      <nav className="bg-gray-900 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <span className="font-elixia text-3xl text-gradient">Dashboard</span>
          <Button variant="destructive" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </nav>
      
      <header className="bg-gray-800 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to your Dashboard</h1>
          <p className="text-gray-400">Manage your products, track your sales, and more.</p>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-12">
          <div className="md:col-span-3">
            <div className="glass-card p-6 rounded-xl">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12 border border-primary/10">
                  <AvatarImage src={user.user_metadata?.avatar_url || ''} alt={user.user_metadata?.full_name || 'User'} />
                  <AvatarFallback>{user.user_metadata?.full_name ? getInitials(user.user_metadata?.full_name) : 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold">{user.user_metadata?.full_name || 'User'}</h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              
              <div className="space-y-2 mt-6">
                <Button variant="secondary" className="w-full" onClick={() => navigate('/update-profile')}>
                  Update Profile
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => navigate('/create-product')}>
                  Create Product
                </Button>
                
                {!userLiveSession ? (
                  <Button
                    variant="outline"
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
                    onClick={() => setIsLiveDialogOpen(true)}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Go Live
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20 animate-pulse"
                    onClick={() => navigate(`/video-conference/${userLiveSession.room_id}`)}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Resume Live Session
                  </Button>
                )}
              </div>
            </div>
            
            <div className="glass-card p-6 rounded-xl mt-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <Button variant="ghost" className="w-full justify-start">
                <User className="mr-2 h-4 w-4" />
                View Profile
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings mr-2 h-4 w-4"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.11a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/><path d="M12 14.78a2 2 0 0 0-2-2.22l-1.44-.35a2 2 0 0 1-1.34-1.78l-.11-1.89a2 2 0 0 0-2-1.72H4a2 2 0 0 0-2 2v.11a2 2 0 0 0 2 2h.11a2 2 0 0 1 1.72 2l.11 1.89a2 2 0 0 0 2 1.72h.89a2 2 0 0 0 2 2.22z"/><path d="M20 16.72a2 2 0 0 0 2-2.22l-1.44-.35a2 2 0 0 1-1.34-1.78l-.11-1.89a2 2 0 0 0-2-1.72H16a2 2 0 0 0-2 2v.11a2 2 0 0 0 2 2h.11a2 2 0 0 1 1.72 2l.11 1.89a2 2 0 0 0 2 1.72h.89a2 2 0 0 0 2 2.22z"/><path d="M8 8a2 2 0 1 1 4 0 2 2 0 0 1-4 0z"/><path d="M16 16a2 2 0 1 1 4 0 2 2 0 0 1-4 0z"/></svg>
                Settings
              </Button>
            </div>
          </div>
          
          <div className="md:col-span-9">
            <Tabs defaultValue="products">
              <TabsList className="mb-4">
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="buyer">My Purchases</TabsTrigger>
                <TabsTrigger value="seller">My Sales</TabsTrigger>
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
                <TabsTrigger value="live">Live Sessions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="products">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {isLoading ? (
                    <div className="col-span-full text-center">Loading...</div>
                  ) : products.length > 0 ? (
                    products.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))
                  ) : (
                    <div className="col-span-full text-center">No products found.</div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="buyer">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {isLoading ? (
                    <div className="col-span-full text-center">Loading...</div>
                  ) : purchases.length > 0 ? (
                    purchases.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))
                  ) : (
                    <div className="col-span-full text-center">No purchases found.</div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="seller">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {isLoading ? (
                    <div className="col-span-full text-center">Loading...</div>
                  ) : sales.length > 0 ? (
                    sales.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))
                  ) : (
                    <div className="col-span-full text-center">No sales found.</div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="appointments">
                <AppointmentManager isSeller={true} />
              </TabsContent>
              
              <TabsContent value="live">
                <LiveSessionsTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <LiveSessionDialog 
        open={isLiveDialogOpen} 
        onOpenChange={setIsLiveDialogOpen} 
      />
      
      <footer className="bg-gray-900 py-6 text-center text-gray-400">
        <p>&copy; {new Date().getFullYear()} PixelBloom. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Dashboard;
