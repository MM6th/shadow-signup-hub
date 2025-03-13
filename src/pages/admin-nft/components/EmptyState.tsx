
import React from 'react';
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  buttonText,
  onClick,
  icon = <Package size={48} className="mx-auto text-pi-muted mb-4" />
}) => {
  return (
    <div className="text-center py-12 glass-card rounded-lg">
      {icon}
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-pi-muted max-w-md mx-auto mb-4">
        {description}
      </p>
      <Button onClick={onClick}>
        <Plus size={16} className="mr-2" /> {buttonText}
      </Button>
    </div>
  );
};
