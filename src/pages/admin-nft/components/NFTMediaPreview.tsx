
import React from 'react';
import { Music, Video, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NFTMediaPreviewProps {
  contentType: string;
  mediaPreview: string | null;
  mediaFile: File | null;
  onRemoveMedia: () => void;
  onMediaChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const NFTMediaPreview: React.FC<NFTMediaPreviewProps> = ({
  contentType,
  mediaPreview,
  mediaFile,
  onRemoveMedia,
  onMediaChange,
}) => {
  // Determine the accept attribute for the file input based on content type
  let acceptTypes = "image/*";
  let placeholderText = "Upload an image";
  let icon = <Upload className="mb-2 text-pi-muted" size={24} />;
  
  switch (contentType) {
    case 'video':
      acceptTypes = "video/*";
      placeholderText = "Upload a video file";
      icon = <Video className="mb-2 text-pi-muted" size={24} />;
      break;
    case 'book':
      acceptTypes = ".pdf,.epub,.mobi";
      placeholderText = "Upload a document (PDF, EPUB)";
      icon = <FileText className="mb-2 text-pi-muted" size={24} />;
      break;
    case 'audio':
      acceptTypes = "audio/*";
      placeholderText = "Upload an audio file";
      icon = <Music className="mb-2 text-pi-muted" size={24} />;
      break;
  }

  return (
    <div className="mt-1">
      {mediaPreview ? (
        <div className="relative rounded-lg overflow-hidden w-full h-40">
          {contentType === 'image' ? (
            <img
              src={mediaPreview}
              alt="NFT Preview"
              className="w-full h-full object-cover"
            />
          ) : contentType === 'video' ? (
            <video
              src={mediaPreview}
              controls
              className="w-full h-full object-contain"
            />
          ) : contentType === 'audio' ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
              <Music className="h-12 w-12 mb-2 text-pi-muted" />
              <audio src={mediaPreview} controls className="w-3/4" />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
              <FileText className="h-12 w-12 mb-2 text-pi-muted" />
              <p className="text-sm text-pi-muted">
                {mediaFile ? mediaFile.name : 'File uploaded'}
              </p>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute bottom-2 right-2"
            onClick={onRemoveMedia}
          >
            Change
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-500 rounded-lg h-40 cursor-pointer hover:border-pi-focus">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {icon}
            <span className="text-sm text-pi-muted">{placeholderText}</span>
          </div>
          <input
            type="file"
            accept={acceptTypes}
            className="hidden"
            onChange={onMediaChange}
          />
        </label>
      )}
    </div>
  );
};
