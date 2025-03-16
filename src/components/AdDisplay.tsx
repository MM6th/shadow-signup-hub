
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Image, Video, ExternalLink, Tags, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useProfile';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface Ad {
  id: string;
  title: string;
  media_type: 'image' | 'video';
  media_url: string;
  product_url: string | null;
  industry: string | null;
  created_at: string;
  user_id: string;
}

interface AdDisplayProps {
  ads: Ad[];
  isLoading?: boolean;
  onProductClick?: (productId: string) => void;
}

const AdCard = ({ ad, onProductClick }: { ad: Ad, onProductClick?: (productId: string) => void }) => {
  const { profile, isLoading } = useProfile(ad.user_id);
  const navigate = useNavigate();
  
  const handleProductClick = () => {
    if (ad.product_url && onProductClick) {
      onProductClick(ad.product_url);
    }
  };

  return (
    <div className="glass-card overflow-hidden group">
      <div className="h-64 bg-dark-secondary relative overflow-hidden">
        {ad.media_type === 'image' ? (
          <img 
            src={ad.media_url} 
            alt={ad.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <video 
            src={ad.media_url} 
            controls 
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-md flex items-center text-xs">
          {ad.media_type === 'image' ? (
            <><Image size={12} className="mr-1" /> Image</>
          ) : (
            <><Video size={12} className="mr-1" /> Video</>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Avatar className="w-8 h-8">
            {profile?.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt={profile?.username || 'user'} />
            ) : (
              <User className="h-4 w-4" />
            )}
          </Avatar>
          <span className="text-sm font-medium">
            {isLoading ? "Loading..." : profile?.username || "Anonymous"}
          </span>
        </div>
        
        <h3 className="text-lg font-medium line-clamp-2 mb-2">{ad.title}</h3>
        
        {ad.industry && (
          <div className="text-xs text-muted-foreground mb-3 flex items-center">
            <Tags size={12} className="mr-1" />
            {ad.industry}
          </div>
        )}
        
        {ad.product_url && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center justify-center"
            onClick={handleProductClick}
          >
            <ExternalLink size={14} className="mr-1" />
            View Product
          </Button>
        )}
      </div>
    </div>
  );
};

const AdDisplay: React.FC<AdDisplayProps> = ({ ads, isLoading = false, onProductClick }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="text-center p-8 border border-gray-700 rounded-md bg-dark-secondary">
        <Tags className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No Ads Found</h3>
        <p className="text-muted-foreground mb-4">
          There are no ads to display at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} onProductClick={onProductClick} />
      ))}
    </div>
  );
};

export default AdDisplay;
