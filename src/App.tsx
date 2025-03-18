
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import CreateProfile from '@/pages/CreateProfile';
import UpdateProfile from '@/pages/UpdateProfile';
import Marketplace from '@/pages/Marketplace';
import CreateProduct from '@/pages/CreateProduct';
import EditProduct from '@/pages/EditProduct';
import AdminNFT from '@/pages/AdminNFT';
import DigitalOffice from '@/pages/DigitalOffice';
import NotFound from '@/pages/NotFound';
import LiveStream from '@/pages/LiveStream';
import { Toaster } from '@/components/ui/toaster';
import ChartReport from '@/pages/ChartReport';
import ScreenplayView from '@/pages/ScreenplayView';
import { AuthProvider } from '@/context/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-profile" element={<CreateProfile />} />
          <Route path="/update-profile" element={<UpdateProfile />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/create-product" element={<CreateProduct />} />
          <Route path="/edit-product/:productId" element={<EditProduct />} />
          <Route path="/chart-report/:chartId" element={<ChartReport />} />
          <Route path="/screenplay/:screenplayId" element={<ScreenplayView />} />
          <Route path="/admin-nft" element={<AdminNFT />} />
          <Route path="/digital-office" element={<DigitalOffice />} />
          <Route path="/livestream/:conferenceId" element={<LiveStream />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
