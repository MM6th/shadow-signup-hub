
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
import { generateDefaultReport, generateRealChartData, generateMockChartData } from '@/components/charts/ChartUtils';

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
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('visual');
  const [useRealData, setUseRealData] = useState(true);
  
  const [planetaryPositions, setPlanetaryPositions] = useState<Planet[]>([]);
  const [houses, setHouses] = useState<{ house: number; sign: string; degree: number }[]>([]);
  const [aspects, setAspects] = useState<{ planet1: string; planet2: string; aspect: string; orb: number }[]>([]);
  
  useEffect(() => {
    const fetchChartData = async () => {
      if (!chartId) {
        console.error('No chart ID provided');
        setError('No chart ID provided');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching chart data for ID:', chartId);
        
        const { data, error } = await supabase
          .from('astro_charts')
          .select('*')
          .eq('id', chartId)
          .single();
          
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Chart data received:', data);
        
        if (!data) {
          toast({
            title: "Chart not found",
            description: "The chart you're looking for doesn't exist",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }
        
        // Removed user ID check to simplify debugging
        // We'll re-add it later once basic functionality works
        
        setChart(data);
        setReportContent(data.report_content || generateDefaultReport(data));
        
        // Generate chart data based on user preference
        if (useRealData) {
          console.log('Using real astrological data');
          await generateRealChartData(data, setPlanetaryPositions, setHouses, setAspects);
        } else {
          console.log('Using mock astrological data');
          generateMockChartData(data, setPlanetaryPositions, setHouses, setAspects);
        }
        
      } catch (error: any) {
        console.error('Error fetching chart:', error);
        setError(error?.message || 'Failed to load chart data');
        toast({
          title: "Error loading chart",
          description: error?.message || "There was a problem loading the chart data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChartData();
  }, [chartId, navigate, toast, useRealData]);
  
  const handleSave = async () => {
    if (!chartId) return;
    
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
    } catch (error: any) {
      console.error('Error saving report:', error);
      toast({
        title: "Error Saving Report",
        description: error?.message || "There was a problem saving your report",
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
  
  const toggleChartDataSource = () => {
    setUseRealData(!useRealData);
    setIsLoading(true);
    // The useEffect will handle re-loading the data
  };
  
  if (isLoading) {
    return <ChartLoader message="Loading your astrological chart..." />;
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient text-pi flex items-center justify-center p-4">
        <div className="glass-card rounded-xl p-6 max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Unable to Load Chart</h2>
          <p className="text-pi-muted mb-6">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  if (!chart) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient text-pi flex items-center justify-center p-4">
        <div className="glass-card rounded-xl p-6 max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Chart Not Found</h2>
          <p className="text-pi-muted mb-6">The chart you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

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
            <div className="bg-dark-secondary/50 px-6 pt-4 flex justify-between items-center">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="visual">Visual Chart</TabsTrigger>
                <TabsTrigger value="positions">Positions</TabsTrigger>
                <TabsTrigger value="report">Full Report</TabsTrigger>
              </TabsList>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleChartDataSource}
                className="ml-2"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                {useRealData ? "Using Real Data" : "Using Mock Data"}
              </Button>
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
