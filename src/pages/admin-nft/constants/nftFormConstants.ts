
import React from 'react';
import { FileText, Music, Upload, Video } from 'lucide-react';

export const BLOCKCHAIN_OPTIONS = [
  { value: 'ethereum', label: 'Ethereum', symbol: 'ETH' },
  { value: 'polygon', label: 'Polygon', symbol: 'MATIC' },
  { value: 'solana', label: 'Solana', symbol: 'SOL' },
  { value: 'binance', label: 'Binance Smart Chain', symbol: 'BNB' },
];

export const CONTENT_TYPE_OPTIONS = [
  { value: 'image', label: 'Image', icon: <Upload className="w-4 h-4 mr-2" /> },
  { value: 'video', label: 'Video', icon: <Video className="w-4 h-4 mr-2" /> },
  { value: 'book', label: 'Book', icon: <FileText className="w-4 h-4 mr-2" /> },
  { value: 'audio', label: 'Audio', icon: <Music className="w-4 h-4 mr-2" /> },
];
