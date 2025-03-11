
import React from 'react';
import { Star, ShoppingCart, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
}

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  showEditButton?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, showEditButton = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwner = user && product.user_id === user.id;

  return (
    <div 
      className="glass-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-pi-focus/20 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden bg-dark-secondary">
        <img 
          src={product.imageUrl} 
          alt={product.title} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          onError={(e) => {
            // Fallback for broken images
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        <div className="absolute top-2 right-2 bg-pi-focus text-white text-xs font-bold px-2 py-1 rounded-full">
          {product.category}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium line-clamp-1">{product.title}</h3>
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 mr-1" />
            <span className="text-sm">{product.rating}</span>
          </div>
        </div>
        
        <p className="text-pi-muted text-sm mb-4 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-medium">${product.price.toFixed(2)}</span>
          <div className="flex gap-2">
            {showEditButton && isOwner && (
              <Button 
                size="sm" 
                variant="outline" 
                className="group" 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/edit-product/${product.id}`);
                }}
              >
                <Edit className="h-4 w-4 mr-1 group-hover:text-pi-focus" />
                <span>Edit</span>
              </Button>
            )}
            <Button size="sm" variant="outline" className="group" onClick={(e) => {
              e.stopPropagation();
              // View product details
              onClick();
            }}>
              <ShoppingCart className="h-4 w-4 mr-1 group-hover:text-pi-focus" />
              <span>View</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
