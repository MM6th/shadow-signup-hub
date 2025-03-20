
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ScreenplayModal } from '@/components/charts/ScreenplayModal';

const ScreenplayTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [screenplays, setScreenplays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScreenplays();
  }, [user]);

  const fetchScreenplays = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('screenplay_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setScreenplays(data || []);
    } catch (error: any) {
      console.error('Error fetching screenplays:', error);
      toast({
        title: "Error",
        description: "Failed to load screenplays",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewScreenplay = (screenplayId: string) => {
    navigate(`/screenplay/${screenplayId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Screenplays</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Screenplay
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : screenplays.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center py-10">
            <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Screenplays</h3>
            <p className="text-gray-500">
              You don't have any screenplays created yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screenplays.map((screenplay) => (
            <Card key={screenplay.id} className="overflow-hidden">
              <CardContent className="p-4">
                <h3 className="font-medium text-lg mb-2">{screenplay.name}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Created: {new Date(screenplay.created_at).toLocaleDateString()}
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => handleViewScreenplay(screenplay.id)}
                >
                  View Screenplay
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <ScreenplayModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onSuccess={fetchScreenplays}
      />
    </div>
  );
};

export default ScreenplayTab;
