
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ScreenplayView = () => {
  const { screenplayId } = useParams<{ screenplayId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [screenplay, setScreenplay] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('characters');
  
  useEffect(() => {
    const fetchScreenplayData = async () => {
      if (!screenplayId) {
        setError('No screenplay ID provided');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching screenplay data for ID:', screenplayId);
        
        const { data, error } = await supabase
          .from('screenplay_projects')
          .select('*')
          .eq('id', screenplayId)
          .single();
          
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Screenplay data received:', data);
        
        if (!data) {
          toast({
            title: "Screenplay not found",
            description: "The screenplay you're looking for doesn't exist",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }
        
        setScreenplay(data);
      } catch (error: any) {
        console.error('Error fetching screenplay:', error);
        setError(error?.message || 'Failed to load screenplay data');
        toast({
          title: "Error loading screenplay",
          description: error?.message || "There was a problem loading the screenplay data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchScreenplayData();
  }, [screenplayId, navigate, toast]);
  
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
      <div className="min-h-screen bg-dark bg-dark-gradient text-pi flex items-center justify-center p-4">
        <div className="glass-card rounded-xl p-6 max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Loading Screenplay...</h2>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pi"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient text-pi flex items-center justify-center p-4">
        <div className="glass-card rounded-xl p-6 max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Unable to Load Screenplay</h2>
          <p className="text-pi-muted mb-6">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  if (!screenplay) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient text-pi flex items-center justify-center p-4">
        <div className="glass-card rounded-xl p-6 max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Screenplay Not Found</h2>
          <p className="text-pi-muted mb-6">The screenplay you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Extract screenplay data
  const { ai_generated_content, name, created_at, images } = screenplay;
  const {
    character_profile,
    screenplay_outline,
    sample_scene
  } = ai_generated_content;

  return (
    <div className="min-h-screen bg-dark bg-dark-gradient text-pi py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-elixia text-gradient">{name}</h1>
            <p className="text-pi-muted">
              Created: {new Date(created_at).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
        
        {/* Images */}
        {images && images.length > 0 && (
          <div className="glass-card rounded-xl p-6 mb-8">
            <h2 className="text-xl font-medium mb-4">Reference Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((imageUrl: string, index: number) => (
                <div key={index} className="relative group">
                  <img 
                    src={imageUrl} 
                    alt={`Reference ${index + 1}`} 
                    className="rounded-md object-cover h-40 w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Character Profile */}
        <Card className="mb-8 bg-dark-secondary/30 border-dark-accent text-pi">
          <CardHeader>
            <CardTitle>Character Profile: {character_profile.name}</CardTitle>
            <CardDescription className="text-pi-muted">
              Main character details and background information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Background</h3>
                <p>{character_profile.background}</p>
              </div>
              <div>
                <h3 className="font-medium">Personality</h3>
                <p>{character_profile.personality}</p>
              </div>
              <div>
                <h3 className="font-medium">Physical Attributes</h3>
                <p>{character_profile.physical_attributes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Screenplay Outline */}
        <div className="glass-card rounded-xl overflow-hidden mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="bg-dark-secondary/50 px-6 pt-4">
              <h2 className="text-xl font-medium mb-4">Screenplay Outline</h2>
              <TabsList className="grid grid-cols-3 max-w-md">
                <TabsTrigger value="characters">Characters</TabsTrigger>
                <TabsTrigger value="plot">Plot</TabsTrigger>
                <TabsTrigger value="scene">Sample Scene</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h3 className="font-medium">Title</h3>
                <p className="text-lg">{screenplay_outline.title}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="font-medium">Logline</h3>
                <p>{screenplay_outline.logline}</p>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium">Setting</h3>
                <p>{screenplay_outline.setting}</p>
              </div>
              
              <Separator className="my-6 bg-dark-accent" />
              
              <TabsContent value="characters" className="mt-0 space-y-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Character</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {screenplay_outline.characters.map((character: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{character.name}</TableCell>
                        <TableCell>{character.role}</TableCell>
                        <TableCell>{character.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="plot" className="mt-0">
                <h3 className="font-medium mb-4">Plot Points</h3>
                <ol className="space-y-4 list-decimal pl-5">
                  {screenplay_outline.plot_points.map((point: string, index: number) => (
                    <li key={index} className="pl-1">{point}</li>
                  ))}
                </ol>
              </TabsContent>
              
              <TabsContent value="scene" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium">Scene: {sample_scene.scene_title}</h3>
                    <p className="text-sm text-pi-muted">{sample_scene.setting}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm italic">{sample_scene.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Dialogue</h4>
                    <div className="space-y-4">
                      {sample_scene.dialogue.map((line: any, index: number) => (
                        <div key={index}>
                          <p className="font-medium">{line.character}</p>
                          <p className="pl-6">"{line.line}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ScreenplayView;
