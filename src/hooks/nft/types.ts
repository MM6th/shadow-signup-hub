
import { Database } from '@/integrations/supabase/types';

export interface NFT {
  id: string;
  title: string;
  description: string;
  price: number;
  imageurl: string; // Original image field
  tokenid: string | null;
  collection: string;
  created_at: string;
  owner_id: string;
  blockchain: string;
  status: 'draft' | 'minting' | 'minted' | 'listed' | 'sold';
  currency?: string;
  // Fields for multiple content types
  content_type: 'image' | 'video' | 'book' | 'audio';
  file_url: string | null;
  file_type: string | null;
}

export interface NFTCollection {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  image_url: string | null;
  nfts?: NFT[]; // Added to store NFTs in this collection
}
