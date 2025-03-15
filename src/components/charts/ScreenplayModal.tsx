import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, BookOpen, User, Loader2 } from 'lucide-react';
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

  const generateScreenplay = async (values: z.infer<typeof formSchema>, imageUrls: string[]) => {
    try {
      setIsGenerating(true);
      
      console.log("Calling generate-screenplay function with:", {
        projectName: values.projectName,
        characterDescription: values.characterDescription || "",
        bookText: values.bookText || "",
        imageUrls: imageUrls
      });
      
      // Call our edge function to generate screenplay content
      const response = await fetch(`${window.location.origin}/functions/v1/generate-screenplay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: values.projectName,
          characterDescription: values.characterDescription || "",
          bookText: values.bookText || "",
          imageUrls: imageUrls
        }),
      });
      
      console.log("Response status:", response.status);
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Received non-JSON response from server");
      }
      
      const result = await response.json();
      console.log("Function response:", result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate screenplay content');
      }
      
      setIsGenerating(false);
      return result.data;
    } catch (error) {
      console.error("Error generating screenplay:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate screenplay content. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
      return null;
    }
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
      
      // 1. Upload images
      const imageUrls = await uploadImages();
      console.log("Images uploaded:", imageUrls);
      
      // 2. Generate screenplay content using AI
      toast({
        title: "Generating Content",
        description: "Creating your screenplay content with AI...",
      });
      
      const screenplayData = await generateScreenplay(values, imageUrls);
      if (!screenplayData) {
        setIsSubmitting(false);
        return;
      }
      
      console.log("Screenplay data generated:", screenplayData);
      
      // 3. Save screenplay project to database
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      
      console.log("Saving to screenplay_projects table");
      const { error } = await supabase
        .from('screenplay_projects')
        .insert({
          name: values.projectName,
          character_description: values.characterDescription || null,
          book_text: values.bookText || null,
          images: imageUrls,
          ai_generated_content: screenplayData,
          user_id: userId
        });
        
      if (error) {
        console.error("Database error:", error);
        throw error;
      }
      
      toast({
        title: "Success!",
        description: "Screenplay project created successfully.",
      });
      
      // 4. Close modal and navigate to the screenplay view page
      onOpenChange(false);
      // navigate(`/screenplay/${screenplayId}`); // Uncomment when the screenplay page is created
      
    } catch (error: any) {
      console.error("Error creating screenplay project:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to create screenplay project.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-dark-secondary text-white border-dark-accent">
        <DialogHeader>
          <DialogTitle className="text-2xl font-elixia text-gradient">Create Screenplay Project</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
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
