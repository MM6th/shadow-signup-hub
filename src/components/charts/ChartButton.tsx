
import React, { useState } from 'react';
import { Plus, ChartPie, FilmIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartCreationModal } from './ChartCreationModal';
import { ScreenplayModal } from './ScreenplayModal';
import { useAuth } from '@/context/AuthContext';

const ADMIN_EMAILS = ['cmooregee@gmail.com'];

interface ChartButtonProps {
  className?: string;
}

export function ChartButton({ className }: ChartButtonProps) {
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isScreenplayModalOpen, setIsScreenplayModalOpen] = useState(false);
  const { user } = useAuth();
  
  // Check if the current user is an admin
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
  
  // If not an admin, don't render the buttons
  if (!isAdmin) {
    return null;
  }
  
  return (
    <>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => setIsChartModalOpen(true)}
          className={`flex items-center gap-2 ${className}`}
        >
          <Plus size={16} />
          <ChartPie size={16} />
          Chart
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => setIsScreenplayModalOpen(true)}
          className={`flex items-center gap-2 ${className}`}
        >
          <Plus size={16} />
          <FilmIcon size={16} />
          Screenplay
        </Button>
      </div>
      
      <ChartCreationModal 
        open={isChartModalOpen}
        onOpenChange={setIsChartModalOpen}
      />
      
      <ScreenplayModal 
        open={isScreenplayModalOpen}
        onOpenChange={setIsScreenplayModalOpen}
      />
    </>
  );
}
