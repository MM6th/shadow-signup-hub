import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, 
  Download, 
  Save, 
  PenSquare, 
  Sparkles, 
  Printer
} from 'lucide-react';
import { 
  Sun,
  Moon,
  Mercury,
  Venus,
  Mars,
  Jupiter,
  Saturn,
  Uranus,
  Neptune
} from '@/components/icons/PlanetIcons';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
        
        generateMockChartData(data);
        
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
  
  const generateMockChartData = (chartData: any) => {
    const seed = chartData.id.charCodeAt(0) + chartData.birth_date.charCodeAt(0);
    
    const mockPlanets: Planet[] = [
      { 
        name: 'Sun', 
        sign: getZodiacSign(seed % 12), 
        house: (seed % 12) + 1, 
        degree: seed % 30, 
        icon: Sun,
        description: `The Sun in ${getZodiacSign(seed % 12)} suggests a personality that is ${getSignTraits(seed % 12)}.`
      },
      { 
        name: 'Moon', 
        sign: getZodiacSign((seed + 3) % 12), 
        house: ((seed + 3) % 12) + 1, 
        degree: (seed + 10) % 30, 
        icon: Moon,
        description: `The Moon in ${getZodiacSign((seed + 3) % 12)} indicates emotional patterns that are ${getSignTraits((seed + 3) % 12)}.`
      },
      { 
        name: 'Mercury', 
        sign: getZodiacSign((seed + 1) % 12), 
        house: ((seed + 1) % 12) + 1, 
        degree: (seed + 5) % 30, 
        icon: Mercury,
        description: `Mercury in ${getZodiacSign((seed + 1) % 12)} shapes a communication style that is ${getSignTraits((seed + 1) % 12)}.`
      },
      { 
        name: 'Venus', 
        sign: getZodiacSign((seed + 2) % 12), 
        house: ((seed + 2) % 12) + 1, 
        degree: (seed + 15) % 30, 
        icon: Venus,
        description: `Venus in ${getZodiacSign((seed + 2) % 12)} indicates love and values focused on being ${getSignTraits((seed + 2) % 12)}.`
      },
      { 
        name: 'Mars', 
        sign: getZodiacSign((seed + 4) % 12), 
        house: ((seed + 4) % 12) + 1, 
        degree: (seed + 20) % 30, 
        icon: Mars,
        description: `Mars in ${getZodiacSign((seed + 4) % 12)} gives an energy and drive that is ${getSignTraits((seed + 4) % 12)}.`
      },
      { 
        name: 'Jupiter', 
        sign: getZodiacSign((seed + 5) % 12), 
        house: ((seed + 5) % 12) + 1, 
        degree: (seed + 25) % 30, 
        icon: Jupiter,
        description: `Jupiter in ${getZodiacSign((seed + 5) % 12)} brings expansion and growth through ${getSignTraits((seed + 5) % 12)} qualities.`
      },
      { 
        name: 'Saturn', 
        sign: getZodiacSign((seed + 6) % 12), 
        house: ((seed + 6) % 12) + 1, 
        degree: (seed + 8) % 30, 
        icon: Saturn,
        description: `Saturn in ${getZodiacSign((seed + 6) % 12)} creates structure and discipline in ${getSignTraits((seed + 6) % 12)} areas.`
      },
      { 
        name: 'Uranus', 
        sign: getZodiacSign((seed + 7) % 12), 
        house: ((seed + 7) % 12) + 1, 
        degree: (seed + 12) % 30, 
        icon: Uranus,
        description: `Uranus in ${getZodiacSign((seed + 7) % 12)} brings revolutionary changes through ${getSignTraits((seed + 7) % 12)} approaches.`
      },
      { 
        name: 'Neptune', 
        sign: getZodiacSign((seed + 8) % 12), 
        house: ((seed + 8) % 12) + 1, 
        degree: (seed + 18) % 30, 
        icon: Neptune,
        description: `Neptune in ${getZodiacSign((seed + 8) % 12)} dissolves boundaries through ${getSignTraits((seed + 8) % 12)} ideals.`
      }
    ];
    
    setPlanetaryPositions(mockPlanets);
    
    const mockHouses = Array.from({ length: 12 }, (_, i) => ({
      house: i + 1,
      sign: getZodiacSign((seed + i) % 12),
      degree: ((seed + i * 3) % 30)
    }));
    
    setHouses(mockHouses);
    
    const mockAspects = [
      { planet1: 'Sun', planet2: 'Moon', aspect: 'Conjunction', orb: 2.1 },
      { planet1: 'Mercury', planet2: 'Venus', aspect: 'Trine', orb: 0.5 },
      { planet1: 'Mars', planet2: 'Saturn', aspect: 'Square', orb: 1.3 },
      { planet1: 'Jupiter', planet2: 'Sun', aspect: 'Opposition', orb: 3.2 },
      { planet1: 'Venus', planet2: 'Neptune', aspect: 'Sextile', orb: 0.8 }
    ];
    
    setAspects(mockAspects);
  };
  
  const getZodiacSign = (index: number): string => {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 
      'Leo', 'Virgo', 'Libra', 'Scorpio', 
      'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    return signs[index];
  };
  
  const getSignTraits = (index: number): string => {
    const traits = [
      'bold and pioneering',
      'grounded and determined',
      'curious and adaptable',
      'nurturing and intuitive',
      'confident and expressive',
      'analytical and precise',
      'balanced and diplomatic',
      'intense and transformative',
      'adventurous and philosophical',
      'disciplined and ambitious',
      'innovative and independent',
      'compassionate and imaginative'
    ];
    return traits[index];
  };
  
  const generateDefaultReport = (chartData: any): string => {
    return `# ${chartData.chart_type.charAt(0).toUpperCase() + chartData.chart_type.slice(1)} Chart for ${chartData.client_name}
    
Birth Information:
- Date: ${new Date(chartData.birth_date).toLocaleDateString()}
- Time: ${chartData.birth_time}
- Location: ${chartData.birth_location}

Chart System: ${chartData.zodiac_type} zodiac with ${chartData.house_system} houses

## Overview
This astrological chart reveals key insights about ${chartData.client_name}'s personality, life path, and potential. The positions of celestial bodies at the time of birth create a unique energetic blueprint.

## Key Planetary Positions
(This section will be populated with the specific planetary positions from the chart calculation)

## Houses and Their Meanings
(This section will detail the houses and signs present in the natal chart)

## Major Aspects
(This section will analyze the significant planetary aspects)

## Interpretation
(The full interpretation will be provided based on the overall chart analysis)

Notes: ${chartData.notes || 'None provided'}`;
  };
  
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
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Loading chart data...</p>
        </div>
      </div>
    );
  }
  
  if (!chart) return null;

  return (
    <div className="min-h-screen bg-dark bg-dark-gradient text-pi py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="aspect-square max-w-xl mx-auto relative rounded-full overflow-hidden border-2 border-pi-focus border-t-transparent bg

