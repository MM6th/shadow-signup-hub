
import React, { useState } from 'react';
import { Plus, ChartPie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartCreationModal } from './ChartCreationModal';
import { useAuth } from '@/context/AuthContext';

const ADMIN_EMAILS = ['cmooregee@gmail.com'];

interface ChartButtonProps {
  className?: string;
}

export function ChartButton({ className }: ChartButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  
  // Check if the current user is an admin
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
  
  // If not an admin, don't render the button
  if (!isAdmin) {
    return null;
  }
  
  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <Plus size={16} />
        <ChartPie size={16} />
        Chart
      </Button>
      
      <ChartCreationModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
