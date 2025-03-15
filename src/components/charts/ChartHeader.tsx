
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PenSquare, Printer, Download, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface ChartHeaderProps {
  chart: any;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  handleSave: () => void;
  handlePrint: () => void;
  handleExportPDF: () => void;
  handleDelete: () => void;
  isSaving: boolean;
}

const ChartHeader: React.FC<ChartHeaderProps> = ({
  chart,
  isEditing,
  setIsEditing,
  handleSave,
  handlePrint,
  handleExportPDF,
  handleDelete,
  isSaving
}) => {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="flex items-center mb-2 text-pi-muted hover:text-pi"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
        </Button>
        
        <h1 className="text-3xl font-elixia text-gradient">
          {chart.chart_type.charAt(0).toUpperCase() + chart.chart_type.slice(1).replace(/([A-Z])/g, ' $1')} Chart
        </h1>
        
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <div className="text-pi-muted">
            Client: <span className="text-pi">{chart.client_name}</span>
          </div>
          <div className="text-pi-muted px-2 border-l border-r border-dark-accent">
            Born: <span className="text-pi">{new Date(chart.birth_date).toLocaleDateString()}</span>
          </div>
          <div className="text-pi-muted">
            System: <span className="text-pi capitalize">{chart.zodiac_type} • {chart.house_system}</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 self-end md:self-auto">
        {isEditing ? (
          <>
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
              className="text-destructive hover:text-destructive"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-pi-focus hover:bg-pi-focus/80"
            >
              <Save size={16} className="mr-2" /> {isSaving ? 'Saving...' : 'Save Report'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <PenSquare size={16} className="mr-2" /> Edit
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer size={16} className="mr-2" /> Print
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download size={16} className="mr-2" /> Export PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 size={16} className="mr-2" /> Delete
            </Button>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-dark-secondary border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Astrological Chart</AlertDialogTitle>
            <AlertDialogDescription className="text-pi-muted">
              Are you sure you want to delete this chart for {chart.client_name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-700 text-white hover:bg-dark-accent/30">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                handleDelete();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChartHeader;
