
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PenSquare, Printer, Download, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChartHeaderProps {
  chart: any;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  handleSave: () => void;
  handlePrint: () => void;
  handleExportPDF: () => void;
  isSaving: boolean;
}

const ChartHeader: React.FC<ChartHeaderProps> = ({
  chart,
  isEditing,
  setIsEditing,
  handleSave,
  handlePrint,
  handleExportPDF,
  isSaving
}) => {
  const navigate = useNavigate();

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
          </>
        )}
      </div>
    </div>
  );
};

export default ChartHeader;
