
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export const uploadFile = async (file: File, contentType: string): Promise<{url: string | null, fileType: string | null}> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // Select the appropriate bucket based on content type
    let bucket = 'profile_NFT_images';
    
    switch (contentType) {
      case 'video':
        bucket = 'profile_NFT_videos';
        break;
      case 'book':
        bucket = 'profile_NFT_books';
        break;
      case 'audio':
        bucket = 'profile_NFT_audios';
        break;
      default:
        bucket = 'profile_NFT_images';
    }
    
    const filePath = `${bucket}/${fileName}`;
    
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);
      
    if (error) {
      console.error("Upload error:", error);
      throw error;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
      
    return { 
      url: publicUrl, 
      fileType: fileExt || '' 
    };
  } catch (error) {
    console.error(`Error uploading file:`, error);
    return { url: null, fileType: null };
  }
};

export const uploadImage = async (file: File, folder = 'nft-images'): Promise<string | null> => {
  const result = await uploadFile(file, 'image');
  return result.url;
};

// Improved utility function to delete a file from storage
export const deleteFileFromStorage = async (fileUrl: string): Promise<boolean> => {
  try {
    if (!fileUrl) {
      console.error("Cannot delete file: URL is empty");
      return false;
    }
    
    console.log("Attempting to delete file:", fileUrl);
    
    // Extract bucket and file name from URL
    // The URL format is like: https://uhqeuhysxkzptbvxgnvt.supabase.co/storage/v1/object/public/profile_NFT_images/filename.ext
    const matches = fileUrl.match(/\/public\/([^\/]+)\/([^\/]+)$/);
    
    if (!matches || matches.length !== 3) {
      console.error("Could not parse file URL for deletion, trying alternative pattern:", fileUrl);
      // Try alternative pattern
      const altMatches = fileUrl.match(/\/([^\/]+)\/([^\/]+)$/);
      if (!altMatches || altMatches.length !== 3) {
        console.error("Could not parse file URL using alternative pattern:", fileUrl);
        return false;
      }
      
      const bucketName = altMatches[1];
      const fileName = altMatches[2];
      
      console.log(`Using alternative pattern - Deleting file from storage: bucket=${bucketName}, file=${fileName}`);
      
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);
        
      if (error) {
        console.error("Error removing file from storage:", error);
        return false;
      }
      
      return true;
    }
    
    const bucketName = matches[1];
    const fileName = matches[2];
    
    console.log(`Deleting file from storage: bucket=${bucketName}, file=${fileName}`);
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);
      
    if (error) {
      console.error("Error removing file from storage:", error);
      return false;
    }
    
    console.log(`Successfully deleted file from bucket ${bucketName}: ${fileName}`);
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
};
