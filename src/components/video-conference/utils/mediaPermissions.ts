
import { useToast } from '@/hooks/use-toast';

export const useMediaPermissions = () => {
  const { toast } = useToast();
  
  const requestPermissions = async (): Promise<boolean> => {
    try {
      console.log("Explicitly requesting camera and microphone permissions...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      console.log("Camera and microphone permissions granted successfully");
      
      // Cleanup the test stream
      stream.getTracks().forEach(track => track.stop());
      
      toast({
        title: "Permissions granted",
        description: "Camera and microphone access allowed",
      });
      
      return true;
    } catch (err: any) {
      console.error("Permission error:", err);
      
      toast({
        title: "Permission Error",
        description: err.message || "Failed to access camera and microphone",
        variant: "destructive",
      });
      
      return false;
    }
  };

  return { requestPermissions };
};
