
import React, { useState, useRef } from 'react';
import { Upload, X, Play, AlertCircle, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface VideoUploaderProps {
  userId: string;
}

// Max file size: 3GB in bytes
const MAX_FILE_SIZE = 3 * 1024 * 1024 * 1024;

interface VideoMetadata {
  title: string;
  description: string;
  thumbnail?: File | null;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ userId }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploads, setCurrentUploads] = useState<{ [key: string]: number }>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMetadataDialogOpen, setIsMetadataDialogOpen] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata>({
    title: '',
    description: '',
    thumbnail: null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Check if the current user is an admin
  const ADMIN_IDS = ['f64a94e3-3adf-4409-978d-f3106aabf598', '3a25fea8-ec60-4e52-ae40-63f2b1ce89d9'];
  const isAdmin = ADMIN_IDS.includes(userId);

  // Show restricted message for non-admin users
  if (!isAdmin) {
    return (
      <div className="text-center p-8 glass-card rounded-lg">
        <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
        <h3 className="text-xl font-medium mb-2">Access Restricted</h3>
        <p className="text-muted-foreground mb-4">
          Only administrators can upload and manage videos.
        </p>
      </div>
    );
  }

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
      
      // Fetch metadata for each video if available
      const videosWithMetadata = await Promise.all(videoFiles.map(async (video) => {
        try {
          const { data: metadataData, error: metadataError } = await supabase
            .from('video_metadata')
            .select('*')
            .eq('video_path', `${userId}/${video.name}`)
            .single();
            
          if (metadataError && metadataError.code !== 'PGRST116') {
            console.error('Error fetching metadata:', metadataError);
          }
          
          return {
            ...video,
            metadata: metadataData || null
          };
        } catch (error) {
          console.error('Error processing video metadata:', error);
          return video;
        }
      }));
      
      setVideos(videosWithMetadata);
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
    if (files.length > 0) validateFile(files[0]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateFile(e.target.files[0]);
    }
  };
  
  const validateFile = (file: File) => {
    // Check if there are files
    if (!file) return;
    
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
    
    // Set the selected file and open metadata dialog
    setSelectedFile(file);
    setVideoMetadata({
      title: file.name.split('.')[0].replace(/_/g, ' '), // Default title from filename
      description: '',
      thumbnail: null
    });
    setIsMetadataDialogOpen(true);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Basic validation for thumbnail (image type, reasonable size)
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid thumbnail type",
          description: "Please upload an image file for the thumbnail",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit for thumbnails
        toast({
          title: "Thumbnail too large",
          description: "Maximum thumbnail size is 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setVideoMetadata(prev => ({
        ...prev,
        thumbnail: file
      }));
    }
  };

  const uploadVideo = async () => {
    if (!selectedFile) return;
    
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const filePath = `${userId}/${fileName}`;
      
      // Start tracking progress
      setCurrentUploads(prev => ({ ...prev, [fileName]: 0 }));
      
      // Use more granular simulation of progress during upload
      const progressInterval = setInterval(() => {
        setCurrentUploads(prev => {
          const currentProgress = prev[fileName] || 0;
          // Incrementing by smaller amounts and ensuring we reach 100%
          if (currentProgress < 98) {
            return { ...prev, [fileName]: currentProgress + 1 };
          }
          return prev;
        });
      }, 150); // More frequent updates
      
      // Upload the video file
      const { data, error } = await supabase.storage
        .from('profile_videos')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      // Clear the progress simulation interval
      clearInterval(progressInterval);
      
      if (error) throw error;
      
      // Set to 100% when complete
      setCurrentUploads(prev => ({ ...prev, [fileName]: 100 }));
      
      // If there's a thumbnail, upload it to the thumbnails bucket
      let thumbnailUrl = null;
      if (videoMetadata.thumbnail) {
        const thumbnailPath = `${userId}/${timestamp}_thumb.${videoMetadata.thumbnail.name.split('.').pop()}`;
        
        const { data: thumbData, error: thumbError } = await supabase.storage
          .from('profile_videos_thumbs')
          .upload(thumbnailPath, videoMetadata.thumbnail, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (thumbError) {
          console.error('Error uploading thumbnail:', thumbError);
          toast({
            title: "Thumbnail upload failed",
            description: thumbError.message || "Failed to upload thumbnail",
            variant: "destructive",
          });
        } else {
          thumbnailUrl = supabase.storage
            .from('profile_videos_thumbs')
            .getPublicUrl(thumbnailPath).data.publicUrl;
        }
      }
      
      // Store video metadata in database
      const { error: metadataError } = await supabase
        .from('video_metadata')
        .insert({
          video_path: filePath,
          title: videoMetadata.title,
          description: videoMetadata.description,
          thumbnail_url: thumbnailUrl,
          user_id: userId,
          created_at: new Date().toISOString()
        });
        
      if (metadataError) {
        console.error('Error saving metadata:', metadataError);
        toast({
          title: "Metadata save failed",
          description: metadataError.message || "Failed to save video information",
          variant: "destructive",
        });
      }
      
      toast({
        title: "Upload successful",
        description: "Your video has been uploaded",
      });
      
      // Reset form and refresh the videos list
      setSelectedFile(null);
      setVideoMetadata({
        title: '',
        description: '',
        thumbnail: null
      });
      setIsMetadataDialogOpen(false);
      
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
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = '';
      }
    }
  };
  
  const deleteVideo = async (fileName: string) => {
    try {
      const filePath = `${userId}/${fileName}`;
      
      // First delete the metadata if it exists
      await supabase
        .from('video_metadata')
        .delete()
        .eq('video_path', filePath);
      
      // Then delete the actual video file
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
                      <p className="font-medium truncate max-w-[200px]">
                        {video.metadata?.title || video.name}
                      </p>
                      <p className="text-xs text-pi-muted">
                        {(video.metadata?.size / (1024 * 1024)).toFixed(2) || 'Unknown'} MB
                      </p>
                      {video.metadata?.description && (
                        <p className="text-xs text-pi-muted mt-1 line-clamp-1">
                          {video.metadata.description}
                        </p>
                      )}
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

      {/* Video Metadata Dialog */}
      <Dialog open={isMetadataDialogOpen} onOpenChange={setIsMetadataDialogOpen}>
        <DialogContent className="bg-dark-secondary text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Video Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-title">Video Title</Label>
              <Input 
                id="video-title"
                value={videoMetadata.title}
                onChange={(e) => setVideoMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a title for your video"
                className="bg-dark border-gray-700"
              />
            </div>
            
            <div>
              <Label htmlFor="video-description">Description</Label>
              <Textarea 
                id="video-description"
                value={videoMetadata.description}
                onChange={(e) => setVideoMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add a description for your video (optional)"
                className="bg-dark border-gray-700 min-h-[100px]"
              />
            </div>
            
            <div>
              <Label htmlFor="video-thumbnail">Thumbnail (Optional)</Label>
              <div className="flex gap-2 items-center">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="w-full"
                >
                  <Image size={16} className="mr-2" /> 
                  {videoMetadata.thumbnail ? 'Change Thumbnail' : 'Upload Thumbnail'}
                </Button>
                <input
                  type="file"
                  ref={thumbnailInputRef}
                  onChange={handleThumbnailChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              {videoMetadata.thumbnail && (
                <p className="text-xs text-pi-muted mt-2">
                  Selected: {videoMetadata.thumbnail.name}
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsMetadataDialogOpen(false);
                setSelectedFile(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={uploadVideo} disabled={!videoMetadata.title}>
              Upload Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoUploader;
