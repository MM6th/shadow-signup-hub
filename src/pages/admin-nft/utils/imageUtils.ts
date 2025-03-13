
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

// Completely rewritten utility function to delete a file from storage
export const deleteFileFromStorage = async (fileUrl: string): Promise<boolean> => {
  if (!fileUrl) {
    console.error("Cannot delete file: URL is empty");
    return false;
  }
  
  console.log("Attempting to delete file:", fileUrl);
  
  try {
    // First, determine if this is a Supabase URL
    if (!fileUrl.includes('supabase')) {
      console.error("URL does not appear to be a Supabase URL:", fileUrl);
      return false;
    }
    
    // Extract bucket and filename from URL
    // Pattern 1: https://[projectref].supabase.co/storage/v1/object/public/[bucket]/[filename]
    let bucketName: string | null = null;
    let fileName: string | null = null;
    
    // Try pattern 1 (full public URL)
    const publicUrlPattern = /\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/;
    const publicMatch = fileUrl.match(publicUrlPattern);
    
    if (publicMatch && publicMatch.length === 3) {
      bucketName = publicMatch[1];
      fileName = publicMatch[2];
      console.log(`Parsed URL (public format): bucket=${bucketName}, file=${fileName}`);
    } else {
      // Try pattern 2 (direct storage path)
      const directPathPattern = /\/([^\/]+)\/([^\/]+)$/;
      const directMatch = fileUrl.match(directPathPattern);
      
      if (directMatch && directMatch.length === 3) {
        bucketName = directMatch[1];
        fileName = directMatch[2];
        console.log(`Parsed URL (direct path): bucket=${bucketName}, file=${fileName}`);
      }
    }
    
    // If we couldn't extract both bucket and filename, fail
    if (!bucketName || !fileName) {
      console.error("Could not extract bucket and filename from URL:", fileUrl);
      console.error("This may indicate the file is not stored in Supabase Storage");
      return false;
    }
    
    // Special handling for known bucket prefixes
    if (bucketName.startsWith('profile_NFT_')) {
      // This is a valid bucket name format
    } else if (['images', 'videos', 'books', 'audios'].includes(bucketName)) {
      // Convert to the proper bucket format
      bucketName = `profile_NFT_${bucketName}`;
      console.log(`Adjusted bucket name to: ${bucketName}`);
    }
    
    // Check if this bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (!bucketExists) {
      console.error(`Bucket "${bucketName}" does not exist. Available buckets:`, 
        buckets?.map(b => b.name).join(', ') || 'none');
      return false;
    }
    
    // Now delete the file
    console.log(`Deleting file from bucket "${bucketName}": ${fileName}`);
    
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
    console.error("Unexpected error during file deletion:", error);
    return false;
  }
};
