
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from './integrations/supabase/client';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import route components
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import NotFound from '@/pages/NotFound';
import DigitalOffice from '@/pages/DigitalOffice';
import CreateProfile from '@/pages/CreateProfile';
import UpdateProfile from '@/pages/UpdateProfile';
import ChartReport from '@/pages/ChartReport';
import ScreenplayView from '@/pages/ScreenplayView';
import Marketplace from '@/pages/Marketplace';
import CreateProduct from '@/pages/CreateProduct';
import EditProduct from '@/pages/EditProduct';
import AdminNFT from '@/pages/AdminNFT';
import AudioDownload from '@/components/AudioDownload';

// Initialize Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Check if user should be redirected to create profile
const RestrictedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  // Paths that don't require authentication
  const publicPaths = ['/', '/charts/:id'];
  const isPublicPath = publicPaths.some(path => {
    const pathPattern = new RegExp(`^${path.replace(/:\w+/g, '[^/]+')}$`);
    return pathPattern.test(location.pathname);
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !isPublicPath) {
    return <Navigate to="/" />;
  }

  if (user && !profile && location.pathname !== '/create-profile') {
    return <Navigate to="/create-profile" />;
  }

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              
              <Route path="/dashboard" element={
                <RestrictedRoute>
                  <Dashboard />
                </RestrictedRoute>
              } />
              
              <Route path="/digital-office" element={
                <RestrictedRoute>
                  <DigitalOffice />
                </RestrictedRoute>
              } />
              
              <Route path="/create-profile" element={
                <RestrictedRoute>
                  <CreateProfile />
                </RestrictedRoute>
              } />
              
              <Route path="/update-profile" element={
                <RestrictedRoute>
                  <UpdateProfile />
                </RestrictedRoute>
              } />
              
              <Route path="/charts/:id" element={<ChartReport />} />
              
              <Route path="/screenplay/:id" element={
                <RestrictedRoute>
                  <ScreenplayView />
                </RestrictedRoute>
              } />
              
              <Route path="/marketplace" element={
                <RestrictedRoute>
                  <Marketplace />
                </RestrictedRoute>
              } />
              
              <Route path="/create-product" element={
                <RestrictedRoute>
                  <CreateProduct />
                </RestrictedRoute>
              } />
              
              <Route path="/edit-product/:id" element={
                <RestrictedRoute>
                  <EditProduct />
                </RestrictedRoute>
              } />
              
              <Route path="/admin-nft" element={
                <RestrictedRoute>
                  <AdminNFT />
                </RestrictedRoute>
              } />
              
              <Route path="/download/:productId" element={
                <RestrictedRoute>
                  <AudioDownload />
                </RestrictedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
