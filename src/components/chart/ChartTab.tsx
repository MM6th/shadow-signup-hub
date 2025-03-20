
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChartBar, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ChartCreationModal } from '@/components/charts/ChartCreationModal';

const ChartTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [charts, setCharts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharts();
  }, [user]);

  const fetchCharts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('astro_charts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setCharts(data || []);
    } catch (error: any) {
      console.error('Error fetching charts:', error);
      toast({
        title: "Error",
        description: "Failed to load charts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewChart = (chartId: string) => {
    navigate(`/chart-report/${chartId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Charts</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Chart
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : charts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center py-10">
            <ChartBar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Charts</h3>
            <p className="text-gray-500">
              You don't have any charts created yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {charts.map((chart) => (
            <Card key={chart.id} className="overflow-hidden">
              <CardContent className="p-4">
                <h3 className="font-medium text-lg mb-2">{chart.client_name}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {new Date(chart.birth_date).toLocaleDateString()} • {chart.chart_type}
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => handleViewChart(chart.id)}
                >
                  View Chart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <ChartCreationModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
};

export default ChartTab;
