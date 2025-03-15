
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Download, Save, PenSquare, Sparkles, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Import refactored components
import ChartLoader from '@/components/charts/ChartLoader';
import ChartHeader from '@/components/charts/ChartHeader';
import ChartVisual from '@/components/charts/ChartVisual';
import ChartPositions from '@/components/charts/ChartPositions';
import ReportContent from '@/components/charts/ReportContent';
import { generateDefaultReport, generateMockChartData } from '@/components/charts/ChartUtils';

interface Planet {
  name: string;
  sign: string;
  house: number;
  degree: number;
  icon: React.ElementType;
  description: string;
}

const ChartReport: React.FC = () => {
  const { chartId } = useParams<{ chartId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [chart, setChart] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('visual');
  
  const [planetaryPositions, setPlanetaryPositions] = useState<Planet[]>([]);
  const [houses, setHouses] = useState<{ house: number; sign: string; degree: number }[]>([]);
  const [aspects, setAspects] = useState<{ planet1: string; planet2: string; aspect: string; orb: number }[]>([]);
  
  useEffect(() => {
    const fetchChartData = async () => {
      if (!chartId || !user) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('astro_charts')
          .select('*')
          .eq('id', chartId)
          .single();
          
        if (error) throw error;
        
        if (!data) {
          toast({
            title: "Chart not found",
            description: "The chart you're looking for doesn't exist",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }
        
        if (data.user_id !== user.id) {
          toast({
            title: "Unauthorized",
            description: "You don't have permission to view this chart",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }
        
        setChart(data);
        setReportContent(data.report_content || generateDefaultReport(data));
        
        // Generate mock data for the chart
        generateMockChartData(data, setPlanetaryPositions, setHouses, setAspects);
        
      } catch (error) {
        console.error('Error fetching chart:', error);
        toast({
          title: "Error loading chart",
          description: "There was a problem loading the chart data",
          variant: "destructive",
        });
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChartData();
  }, [chartId, user, navigate, toast]);
  
  const handleSave = async () => {
    if (!chartId || !user) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('astro_charts')
        .update({ report_content: reportContent, updated_at: new Date().toISOString() })
        .eq('id', chartId);
        
      if (error) throw error;
      
      setIsEditing(false);
      toast({
        title: "Report Saved",
        description: "Your chart report has been saved successfully",
      });
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Error Saving Report",
        description: "There was a problem saving your report",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleExportPDF = () => {
    toast({
      title: "Export PDF",
      description: "PDF export functionality would be implemented here",
    });
  };
  
  if (isLoading) {
    return <ChartLoader />;
  }
  
  if (!chart) return null;

  return (
    <div className="min-h-screen bg-dark bg-dark-gradient text-pi py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ChartHeader 
          chart={chart}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          handleSave={handleSave}
          handlePrint={handlePrint}
          handleExportPDF={handleExportPDF}
          isSaving={isSaving}
        />
        
        <div className="glass-card rounded-xl overflow-hidden mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="bg-dark-secondary/50 px-6 pt-4">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="visual">Visual Chart</TabsTrigger>
                <TabsTrigger value="positions">Positions</TabsTrigger>
                <TabsTrigger value="report">Full Report</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6">
              <TabsContent value="visual" className="mt-0">
                <ChartVisual chart={chart} />
              </TabsContent>
              
              <TabsContent value="positions" className="mt-0">
                <ChartPositions 
                  planetaryPositions={planetaryPositions}
                  houses={houses}
                  aspects={aspects}
                />
              </TabsContent>
              
              <TabsContent value="report" className="mt-0">
                <ReportContent 
                  reportContent={reportContent}
                  isEditing={isEditing}
                  setReportContent={setReportContent}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ChartReport;
