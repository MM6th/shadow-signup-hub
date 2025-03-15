
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Calendar } from '@/components/ui/calendar';
import { Clock } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChartCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Chart form schema
const chartFormSchema = z.object({
  clientName: z.string().min(2, {
    message: "Client name must be at least 2 characters.",
  }),
  birthDate: z.date({
    required_error: "Birth date is required.",
  }),
  birthTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Birth time must be in 24-hour format (HH:MM).",
  }),
  birthLocation: z.string().min(2, {
    message: "Birth location is required.",
  }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  chartType: z.enum(["natal", "solarReturn", "annualProfection"], {
    required_error: "Chart type is required.",
  }),
  houseSystem: z.enum(["placidus", "equal", "whole", "koch", "campanus", "regiomontanus", "porphyry"], {
    required_error: "House system is required.",
  }),
  zodiacType: z.enum(["tropical", "sidereal"], {
    required_error: "Zodiac type is required.",
  }),
  notes: z.string().optional(),
});

type ChartFormValues = z.infer<typeof chartFormSchema>;

const defaultValues: Partial<ChartFormValues> = {
  birthTime: "12:00",
  chartType: "natal",
  houseSystem: "placidus",
  zodiacType: "tropical",
  notes: "",
};

export function ChartCreationModal({ open, onOpenChange }: ChartCreationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [chartCreationType, setChartCreationType] = useState("create");

  const form = useForm<ChartFormValues>({
    resolver: zodResolver(chartFormSchema),
    defaultValues,
  });

  const onSubmit = async (data: ChartFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a chart.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create a timestamp from the date and time
      const birthDateTime = new Date(data.birthDate);
      const [hours, minutes] = data.birthTime.split(':').map(Number);
      birthDateTime.setHours(hours, minutes);

      // Insert chart data into Supabase
      const { data: chartData, error } = await supabase
        .from('astro_charts')
        .insert({
          user_id: user.id,
          client_name: data.clientName,
          birth_date: birthDateTime.toISOString(),
          birth_time: data.birthTime,
          birth_location: data.birthLocation,
          latitude: data.latitude,
          longitude: data.longitude,
          chart_type: data.chartType,
          house_system: data.houseSystem,
          zodiac_type: data.zodiacType,
          notes: data.notes,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Chart Created",
        description: "Your astrological chart has been created successfully.",
      });

      // Close the modal and navigate to the report page
      onOpenChange(false);
      navigate(`/chart-report/${chartData.id}`);
    } catch (error: any) {
      console.error("Error creating chart:", error);
      toast({
        title: "Failed to Create Chart",
        description: error.message || "There was an error creating your chart.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-dark-secondary text-pi">
        <DialogHeader>
          <DialogTitle className="text-gradient font-elixia text-2xl">
            Create Astrological Chart
          </DialogTitle>
          <DialogDescription>
            Enter birth information to generate an astrological chart.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={chartCreationType} onValueChange={setChartCreationType} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create New Chart</TabsTrigger>
            <TabsTrigger value="history">View Chart History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter client name" {...field} className="bg-dark" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="birthLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birth Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, Country" {...field} className="bg-dark" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Birth Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal bg-dark",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-dark" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="birthTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birth Time (24-hour format)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="HH:MM" {...field} className="bg-dark pl-10" />
                            <Clock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Example: 14:30 for 2:30 PM
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g. 51.5074" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                            className="bg-dark" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g. -0.1278" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                            className="bg-dark" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="chartType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chart Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-dark">
                              <SelectValue placeholder="Select a chart type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-dark-secondary">
                            <SelectItem value="natal">Natal Chart</SelectItem>
                            <SelectItem value="solarReturn">Solar Return</SelectItem>
                            <SelectItem value="annualProfection">Annual Profection</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="houseSystem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>House System</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-dark">
                              <SelectValue placeholder="Select a house system" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-dark-secondary">
                            <SelectItem value="placidus">Placidus</SelectItem>
                            <SelectItem value="equal">Equal Houses</SelectItem>
                            <SelectItem value="whole">Whole Sign</SelectItem>
                            <SelectItem value="koch">Koch</SelectItem>
                            <SelectItem value="campanus">Campanus</SelectItem>
                            <SelectItem value="regiomontanus">Regiomontanus</SelectItem>
                            <SelectItem value="porphyry">Porphyry</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="zodiacType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zodiac Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-dark">
                              <SelectValue placeholder="Select a zodiac type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-dark-secondary">
                            <SelectItem value="tropical">Tropical</SelectItem>
                            <SelectItem value="sidereal">Sidereal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Additional notes" {...field} className="bg-dark" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-pi-focus hover:bg-pi-focus/80"
                  >
                    {isLoading ? "Creating..." : "Create Chart"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="history">
            <ChartHistoryList userId={user?.id} onSelect={(chartId) => {
              onOpenChange(false); 
              navigate(`/chart-report/${chartId}`);
            }} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface ChartHistoryProps {
  userId?: string;
  onSelect: (chartId: string) => void;
}

const ChartHistoryList = ({ userId, onSelect }: ChartHistoryProps) => {
  const [charts, setCharts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchCharts = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('astro_charts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setCharts(data || []);
      } catch (error: any) {
        console.error('Error fetching charts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load chart history.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCharts();
  }, [userId, toast]);
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-pi-muted">Loading chart history...</p>
      </div>
    );
  }
  
  if (charts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-pi-muted">No charts have been created yet.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
      {charts.map(chart => (
        <div 
          key={chart.id} 
          className="flex items-center justify-between p-3 rounded-md glass-card cursor-pointer hover:bg-dark-accent/30 transition-colors"
          onClick={() => onSelect(chart.id)}
        >
          <div>
            <h4 className="font-medium">{chart.client_name}</h4>
            <div className="text-sm text-pi-muted">
              <span className="capitalize">{chart.chart_type.replace(/([A-Z])/g, ' $1').trim()} Chart</span>
              <span className="mx-1">•</span>
              <span>{new Date(chart.birth_date).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-xs bg-dark-accent px-2 py-1 rounded capitalize">
            {chart.zodiac_type} • {chart.house_system}
          </div>
        </div>
      ))}
    </div>
  );
};
