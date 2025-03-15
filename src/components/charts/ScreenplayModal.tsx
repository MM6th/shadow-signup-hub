
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, BookOpen, User, Loader2, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ScreenplayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  projectName: z.string().min(2, {
    message: "Project name must be at least 2 characters.",
  }),
  characterDescription: z.string().optional(),
  bookText: z.string().optional(),
});

export function ScreenplayModal({ open, onOpenChange }: ScreenplayModalProps) {
  const [activeTab, setActiveTab] = useState('photo-upload');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
      characterDescription: "",
      bookText: "",
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    setUploadedImages(prev => [...prev, ...newFiles]);
    
    // Create preview URLs
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    
    // Also remove the preview URL and revoke the object URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (uploadedImages.length === 0) return [];
    
    try {
      const imageUrls = [];
      const projectId = uuidv4();
      
      for (let i = 0; i < uploadedImages.length; i++) {
        const file = uploadedImages[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}-${i}.${fileExt}`;
        const filePath = `screenplays/${fileName}`;
        
        console.log(`Uploading image ${i+1}/${uploadedImages.length}`);
        
        const { error: uploadError, data } = await supabase.storage
          .from('media')
          .upload(filePath, file);
          
        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }
        
        console.log("File uploaded successfully:", filePath);
        
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
          
        imageUrls.push(urlData.publicUrl);
      }
      
      console.log("All images uploaded:", imageUrls);
      return imageUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload images.",
        variant: "destructive",
      });
      return [];
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      
      // 1. Upload images
      const imageUrls = await uploadImages();
      console.log("Images uploaded:", imageUrls);
      
      // 2. Generate screenplay content using AI
      toast({
        title: "Generating Content",
        description: "Creating your screenplay content with AI...",
      });
      
      console.log("Calling generate-screenplay function with:", {
        characterName: values.projectName,
        characterDescription: values.characterDescription || "",
        bookText: values.bookText || "",
        images: imageUrls
      });
      
      // Call our edge function to generate screenplay content
      const { data, error } = await supabase.functions.invoke('generate-screenplay', {
        body: {
          characterName: values.projectName,
          characterDescription: values.characterDescription || "",
          bookText: values.bookText || "",
          images: imageUrls
        },
      });
      
      console.log("Function response:", data, error);
      
      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(`Supabase function error: ${error.message}`);
      }
      
      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to generate screenplay content');
      }
      
      toast({
        title: "Success!",
        description: "Screenplay project created successfully.",
      });
      
      // Close modal and navigate to the screenplay view page
      onOpenChange(false);
      navigate(`/screenplay/${data.data.id}`);
      
    } catch (error: any) {
      console.error("Error creating screenplay project:", error);
      setErrorMessage(error.message || "Failed to create screenplay project.");
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to create screenplay project.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-dark-secondary text-white border-dark-accent">
        <DialogHeader>
          <DialogTitle className="text-2xl font-elixia text-gradient">Create Screenplay Project</DialogTitle>
        </DialogHeader>
        
        {errorMessage && (
          <div className="bg-red-500/20 border border-red-500 rounded-md p-3 mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-500">Error</p>
              <p className="text-xs text-red-400">{errorMessage}</p>
            </div>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Character Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter character name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="photo-upload" className="data-[state=active]:bg-pi-focus">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Photo Upload
                </TabsTrigger>
                <TabsTrigger value="character-description" className="data-[state=active]:bg-pi-focus">
                  <User className="mr-2 h-4 w-4" />
                  Character Description
                </TabsTrigger>
                <TabsTrigger value="book-text" className="data-[state=active]:bg-pi-focus">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Book Text
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="photo-upload" className="space-y-4">
                <div className="border-2 border-dashed border-gray-600 rounded-md p-6 text-center">
                  <Label htmlFor="imageUpload" className="cursor-pointer flex flex-col items-center">
                    <UploadCloud className="h-10 w-10 mb-3 text-gray-400" />
                    <span className="text-sm text-gray-400">
                      Drag photos here or click to upload
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Upload multiple photos of your character
                    </span>
                    <Input 
                      id="imageUpload" 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </Label>
                </div>
                
                {imagePreviewUrls.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Uploaded Images:</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={url} 
                            alt={`Preview ${index}`} 
                            className="rounded-md object-cover h-24 w-full"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="character-description" className="space-y-4">
                <FormField
                  control={form.control}
                  name="characterDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Character Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your character in detail..." 
                          className="min-h-[200px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-xs text-gray-400">
                  Provide a detailed description of your character. This will be used in conjunction with the uploaded photos to generate a comprehensive character portfolio.
                </p>
              </TabsContent>
              
              <TabsContent value="book-text" className="space-y-4">
                <FormField
                  control={form.control}
                  name="bookText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Book Text (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Paste text from a book or write your own content..." 
                          className="min-h-[200px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-xs text-gray-400">
                  Enter text from a book or other source material. Our AI will use this to generate a screenplay adaptation featuring your character.
                </p>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-pi-focus hover:bg-pi-focus/80"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Screenplay Project'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
