
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Download, Music, FileAudio, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

const AudioDownload = () => {
  const { productId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [purchaseVerified, setPurchaseVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchProductAndVerifyPurchase = async () => {
      try {
        if (!user || !productId) {
          setIsLoading(false);
          return;
        }
        
        // Fetch product details
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();
        
        if (productError) throw productError;
        
        setProduct(productData);
        
        // Check if user has purchased this product
        const { data: purchaseData, error: purchaseError } = await supabase
          .from("purchases")
          .select("*")
          .eq("product_id", productId)
          .eq("buyer_id", user.id)
          .eq("status", "completed");
        
        if (purchaseError) {
          console.error("Error checking purchase:", purchaseError);
        } else {
          // If purchase exists, verify it
          if (purchaseData && purchaseData.length > 0) {
            setPurchaseVerified(true);
          }
        }
      } catch (error) {
        console.error("Error loading product data:", error);
        toast({
          title: "Error",
          description: "Failed to load product data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProductAndVerifyPurchase();
  }, [productId, user, toast]);
  
  const handleDownload = async (url: string, fileName: string) => {
    try {
      // Record the download activity
      await supabase
        .from("download_activity")
        .insert({
          user_id: user?.id,
          product_id: productId,
          file_url: url,
          file_name: fileName
        });
      
      // Initiate download
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: `Downloading ${fileName}`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "There was a problem downloading the file",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pi-muted">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    navigate("/");
    return null;
  }
  
  if (!product) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient p-6">
        <div className="max-w-3xl mx-auto">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-2xl font-elixia text-gradient">Product Not Found</CardTitle>
              <CardDescription>
                The product you're looking for doesn't exist or has been removed.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate("/marketplace")}>
                Return to Marketplace
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!purchaseVerified) {
    return (
      <div className="min-h-screen bg-dark bg-dark-gradient p-6">
        <div className="max-w-3xl mx-auto">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-2xl font-elixia text-gradient">
                <Lock className="inline-block mr-2" size={24} />
                Access Restricted
              </CardTitle>
              <CardDescription>
                You need to purchase this product to access the download.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-pi-muted mb-4">
                Return to the marketplace to purchase this audio product.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate("/marketplace")}>
                Go to Marketplace
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-dark bg-dark-gradient p-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/marketplace")}
          className="mb-6 text-pi-muted hover:text-pi"
        >
          ← Back to Marketplace
        </Button>
        
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-elixia text-gradient">
              <Music className="inline-block mr-2" size={24} />
              {product.title}
            </CardTitle>
            <CardDescription>
              {product.artist_name && (
                <span className="block">Artist: {product.artist_name}</span>
              )}
              {product.publishing_year && (
                <span className="block">Year: {product.publishing_year}</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {product.description && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-pi-muted">{product.description}</p>
              </div>
            )}
            
            {product.lyrics && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Lyrics/Details</h3>
                <div className="bg-dark-secondary p-4 rounded-md max-h-60 overflow-y-auto">
                  <pre className="text-pi-muted whitespace-pre-wrap">{product.lyrics}</pre>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-medium mb-2">Download Files</h3>
              {product.audio_urls && product.audio_urls.length > 0 ? (
                <div className="space-y-3">
                  {product.audio_urls.map((url: string, index: number) => (
                    <Card key={index} className="bg-dark-secondary flex items-center justify-between p-3">
                      <div className="flex items-center">
                        <FileAudio className="text-pi-muted mr-3" size={24} />
                        <div>
                          <p className="font-medium">{product.audio_file_names?.[index] || `File ${index + 1}`}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(
                          url, 
                          product.audio_file_names?.[index] || `${product.title}-file-${index + 1}`
                        )}
                      >
                        <Download size={16} className="mr-1" /> Download
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-pi-muted">No audio files available for download.</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-pi-muted">
              These files are for your personal use only. Please do not redistribute.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AudioDownload;
