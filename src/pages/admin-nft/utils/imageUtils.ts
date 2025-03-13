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
