
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ConsultationSettingsProps {
  productId: string;
  initialHourlyRate: number;
  initialEnableFreeConsultation: boolean;
  initialEnablePaypal: boolean;
  initialPaypalClientId?: string;
  initialEnableCrypto?: boolean;
  onSettingsUpdated?: () => void;
}

const ConsultationSettings: React.FC<ConsultationSettingsProps> = ({
  productId,
  initialHourlyRate = 0,
  initialEnableFreeConsultation = false,
  initialEnablePaypal = false,
  initialPaypalClientId = '',
  initialEnableCrypto = false,
  onSettingsUpdated
}) => {
  const [hourlyRate, setHourlyRate] = useState(initialHourlyRate);
  const [enableFreeConsultation, setEnableFreeConsultation] = useState(initialEnableFreeConsultation);
  const [enablePaypal, setEnablePaypal] = useState(initialEnablePaypal);
  const [paypalClientId, setPaypalClientId] = useState(initialPaypalClientId || '');
  const [enableCrypto, setEnableCrypto] = useState(initialEnableCrypto);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('products')
        .update({
          price: hourlyRate,
          enable_free_consultation: enableFreeConsultation,
          enable_paypal: enablePaypal,
          paypal_client_id: enablePaypal ? paypalClientId : null,
          enable_crypto: enableCrypto
        })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: "Your consultation settings have been updated successfully."
      });

      if (onSettingsUpdated) {
        onSettingsUpdated();
      }
    } catch (error: any) {
      console.error('Error updating consultation settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultation Settings</CardTitle>
        <CardDescription>Configure pricing and options for your video consultations</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
            <Input
              id="hourlyRate"
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
              placeholder="Enter hourly rate"
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              This is the amount you'll charge per hour for your consultations
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="enableFreeConsultation">Offer Free Consultations</Label>
              <Switch
                id="enableFreeConsultation"
                checked={enableFreeConsultation}
                onCheckedChange={setEnableFreeConsultation}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Allow new clients to book a free introductory session
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="enablePaypal">Enable PayPal Payments</Label>
              <Switch
                id="enablePaypal"
                checked={enablePaypal}
                onCheckedChange={setEnablePaypal}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Allow clients to pay for sessions using PayPal
            </p>
          </div>

          {enablePaypal && (
            <div className="space-y-2">
              <Label htmlFor="paypalClientId">PayPal Client ID</Label>
              <Input
                id="paypalClientId"
                type="text"
                value={paypalClientId}
                onChange={(e) => setPaypalClientId(e.target.value)}
                placeholder="Enter your PayPal Client ID"
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Your PayPal Client ID for processing payments
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="enableCrypto">Enable Cryptocurrency Payments</Label>
              <Switch
                id="enableCrypto"
                checked={enableCrypto}
                onCheckedChange={setEnableCrypto}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Allow clients to pay for sessions using cryptocurrency (configure wallet addresses in Product settings)
            </p>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ConsultationSettings;
