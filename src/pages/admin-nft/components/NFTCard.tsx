import React, { useState } from 'react';
import { Edit, Tag, DollarSign, Music, FileText, Video, Image, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { NFT } from '@/hooks/nft/types';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NFTDeleteDialog } from '../dialogs/NFTDeleteDialog';

interface NFTCardProps {
  nft: NFT;
  onMint: (id: string) => Promise<void>;
  onList: (id: string, price: number) => Promise<void>;
  onEdit: (nft: NFT) => void;
  onDelete?: (id: string) => Promise<void>;
}

export const NFTCard: React.FC<NFTCardProps> = ({ nft, onMint, onList, onEdit, onDelete }) => {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleMint = async () => {
    setIsActionLoading(true);
    try {
      await onMint(nft.id);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleList = async () => {
    setIsActionLoading(true);
    try {
      await onList(nft.id, nft.price);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(nft.id);
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Helper function to render the proper media preview based on content type
  const renderMediaPreview = () => {
    const contentType = nft.content_type || 'image';
    
    switch (contentType) {
      case 'video':
        return (
          <div className="relative w-full h-48 overflow-hidden rounded-t-lg bg-gray-900 flex items-center justify-center">
            {nft.file_url ? (
              <video 
                src={nft.file_url} 
                className="w-full h-full object-cover" 
                controls
              />
            ) : (
              <div className="flex flex-col items-center">
                <Video size={40} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-400">Video NFT</span>
              </div>
            )}
          </div>
        );
      
      case 'book':
        return (
          <div className="relative w-full h-48 overflow-hidden rounded-t-lg bg-gray-900 flex items-center justify-center">
            {nft.imageurl ? (
              <img 
                src={nft.imageurl} 
                alt={nft.title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center">
                <FileText size={40} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-400">Document NFT</span>
                {nft.file_type && <span className="text-xs text-gray-500">{nft.file_type.toUpperCase()}</span>}
              </div>
            )}
          </div>
        );
      
      case 'audio':
        return (
          <div className="relative w-full h-48 overflow-hidden rounded-t-lg bg-gray-900 flex flex-col items-center justify-center">
            <Music size={40} className="text-gray-400 mb-3" />
            <span className="text-sm text-gray-400 mb-2">Audio NFT</span>
            {nft.file_url && (
              <audio 
                src={nft.file_url} 
                controls 
                className="w-4/5 mt-2"
              />
            )}
          </div>
        );
      
      default: // image
        return (
          <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
            <img 
              src={nft.imageurl || '/placeholder.svg'} 
              alt={nft.title} 
              className="w-full h-full object-cover"
            />
          </div>
        );
    }
  };
  
  // Function to get the content type icon
  const getContentTypeIcon = () => {
    switch (nft.content_type) {
      case 'video': return <Video size={16} />;
      case 'book': return <FileText size={16} />;
      case 'audio': return <Music size={16} />;
      default: return <Image size={16} />;
    }
  };

  return (
    <>
      <Card className="bg-dark border border-gray-800 overflow-hidden hover:border-pi-focus transition-all duration-300">
        {renderMediaPreview()}
        
        <CardHeader className="p-4 pb-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-white truncate">{nft.title}</h3>
              <p className="text-xs text-gray-400">{nft.collection}</p>
            </div>
            <div className="flex space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-gray-800 p-1 rounded-sm">
                      {getContentTypeIcon()}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{nft.content_type.charAt(0).toUpperCase() + nft.content_type.slice(1)} NFT</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-gray-800 p-1 rounded-sm">
                      <Tag size={16} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Status: {nft.status}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {onDelete && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 p-0"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete NFT</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-2">
          <p className="text-xs text-gray-400 mb-2 line-clamp-2 h-10">
            {nft.description}
          </p>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <DollarSign size={14} className="text-green-400 mr-1" />
              <span className="text-white font-medium">{nft.price}</span>
              <span className="text-gray-400 ml-1 uppercase text-xs">{nft.currency}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2" 
              onClick={() => onEdit(nft)}
            >
              <Edit size={14} className="mr-1" />
              Edit
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex-col">
          {nft.status === 'draft' && (
            <Button 
              onClick={handleMint} 
              disabled={isActionLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
            >
              {isActionLoading ? 'Minting...' : 'Mint NFT'}
            </Button>
          )}
          
          {nft.status === 'minted' && (
            <Button 
              onClick={handleList} 
              disabled={isActionLoading}
              variant="outline"
              className="w-full border-green-500 text-green-400 hover:bg-green-500/10"
            >
              {isActionLoading ? 'Listing...' : 'List for Sale'}
            </Button>
          )}
          
          {nft.status === 'listed' && (
            <div className="text-center w-full py-2 px-4 bg-green-500/20 rounded-md text-green-400 text-sm">
              Listed for Sale
            </div>
          )}
          
          {nft.status === 'sold' && (
            <div className="text-center w-full py-2 px-4 bg-blue-500/20 rounded-md text-blue-400 text-sm">
              Sold
            </div>
          )}
        </CardFooter>
      </Card>

      {onDelete && (
        <NFTDeleteDialog 
          isOpen={isDeleteDialogOpen}
          setIsOpen={setIsDeleteDialogOpen}
          onDelete={handleDelete}
          isLoading={isActionLoading}
        />
      )}
    </>
  );
};
