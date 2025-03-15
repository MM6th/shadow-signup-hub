
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
import { Toaster } from '@/components/ui/toaster';
import ChartReport from '@/pages/ChartReport';
import { AuthProvider } from '@/context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-profile" element={<CreateProfile />} />
          <Route path="/update-profile" element={<UpdateProfile />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/create-product" element={<CreateProduct />} />
          <Route path="/edit-product/:productId" element={<EditProduct />} />
          <Route path="/chart-report/:chartId" element={<ChartReport />} />
          <Route path="/admin-nft" element={<AdminNFT />} />
          <Route path="/digital-office" element={<DigitalOffice />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
