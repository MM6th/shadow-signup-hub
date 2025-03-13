import React, { useState, useRef } from 'react';
import { Upload, X, Play, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

interface VideoUploaderProps {
  userId: string;
}

// Max file size: 3GB in bytes
const MAX_FILE_SIZE = 3 * 1024 * 1024 * 1024;

const VideoUploader: React.FC<VideoUploaderProps> = ({ userId }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploads, setCurrentUploads] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch existing videos on component mount
  React.useEffect(() => {
    fetchUserVideos();
  }, [userId]);

  const fetchUserVideos = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .storage
        .from('profile_videos')
        .list(userId + '/', {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;
      
      // Map the storage objects to our video format
      const videoFiles = data?.filter(item => !item.name.endsWith('/')) || [];
      setVideos(videoFiles);
    } catch (error: any) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error loading videos",
        description: error.message || "Could not load your videos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };
  
  const handleFiles = (files: FileList) => {
    // Check if there are files
    if (files.length === 0) return;
    
    // Get the file
    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 3GB",
        variant: "destructive",
      });
      return;
    }
    
    // Upload the file
    uploadVideo(file);
  };

  const uploadVideo = async (file: File) => {
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const filePath = `${userId}/${fileName}`;
      
      // For progress tracking, split the upload into chunks and track manually
      setCurrentUploads(prev => ({ ...prev, [fileName]: 0 }));
      
      // Simple simulation of progress during upload (since Supabase doesn't support progress tracking directly)
      const progressInterval = setInterval(() => {
        setCurrentUploads(prev => {
          const currentProgress = prev[fileName] || 0;
          // Increment by a small percentage until 90% to simulate progress
          if (currentProgress < 90) {
            return { ...prev, [fileName]: currentProgress + 5 };
          }
          return prev;
        });
      }, 300);
      
      // Start the upload using Supabase
      const { data, error } = await supabase.storage
        .from('profile_videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      // Clear the interval once upload is complete
      clearInterval(progressInterval);
      
      if (error) throw error;
      
      // Set to 100% when complete
      setCurrentUploads(prev => ({ ...prev, [fileName]: 100 }));
      
      toast({
        title: "Upload successful",
        description: "Your video has been uploaded",
      });
      
      // Refresh the videos list
      await fetchUserVideos();
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setUploadProgress(0);
      // Clear current uploads after a delay to show 100% completion
      setTimeout(() => {
        setCurrentUploads({});
      }, 1000);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const deleteVideo = async (fileName: string) => {
    try {
      const filePath = `${userId}/${fileName}`;
      
      const { error } = await supabase.storage
        .from('profile_videos')
        .remove([filePath]);
      
      if (error) throw error;
      
      // Update the videos state
      setVideos(videos.filter(video => video.name !== fileName));
      
      toast({
        title: "Video deleted",
        description: "Your video has been removed",
      });
    } catch (error: any) {
      console.error('Error deleting video:', error);
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete video",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragging ? 'border-pi-focus bg-dark-accent/20' : 'border-gray-700 hover:border-pi-focus/70'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4 cursor-pointer">
          <Upload size={36} className="text-pi-muted" />
          <div>
            <p className="text-lg font-medium text-white">Drag and drop video here or click to browse</p>
            <p className="text-sm text-pi-muted mt-2">MP4, MOV, or WebM formats • Max file size: 3GB</p>
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="video/*"
            className="hidden"
          />
        </div>
      </div>
      
      {Object.keys(currentUploads).length > 0 && (
        <div className="space-y-2">
          {Object.entries(currentUploads).map(([fileName, progress]) => (
            <div key={fileName} className="space-y-1">
              <div className="flex justify-between items-center">
                <p className="text-sm text-pi-muted truncate max-w-[70%]">{fileName}</p>
                <span className="text-xs text-white">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-medium mb-3">Your Videos</h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-pi-focus border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-pi-muted">Loading your videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-8 glass-card rounded-lg">
            <AlertCircle size={36} className="mx-auto text-pi-muted mb-4" />
            <p className="text-lg text-white font-medium">No videos uploaded yet</p>
            <p className="text-sm text-pi-muted mt-2">Your uploaded videos will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="glass-card rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-md bg-dark-accent flex items-center justify-center">
                      <Play size={20} className="text-pi-focus" />
                    </div>
                    <div>
                      <p className="font-medium truncate max-w-[200px]">{video.name}</p>
                      <p className="text-xs text-pi-muted">
                        {(video.metadata?.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        // Get the URL and open it in a new tab
                        const videoUrl = supabase.storage
                          .from('profile_videos')
                          .getPublicUrl(`${userId}/${video.name}`).data.publicUrl;
                        window.open(videoUrl, '_blank');
                      }}
                    >
                      <Play size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteVideo(video.name)}
                    >
                      <X size={16} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploader;
