
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ProductCard from '@/components/ProductCard';
import FeaturedServices from '@/components/FeaturedServices';

// Sample product data - in a real app, this would come from Supabase
const sampleProducts = [
  {
    id: '1',
    title: 'Personal Cosmic Reading',
    description: 'A comprehensive reading of your cosmic energy tailored specifically for your business journey.',
    price: 149.99,
    category: 'reading',
    rating: 4.8,
    reviewCount: 124,
    imageUrl: '/placeholder.svg'
  },
  {
    id: '2',
    title: 'Business Alignment Session',
    description: 'Align your business goals with the cosmic energies to maximize success and growth potential.',
    price: 299.99,
    category: 'consulting',
    rating: 4.9,
    reviewCount: 89,
    imageUrl: '/placeholder.svg'
  },
  {
    id: '3',
    title: 'Cosmic Strategy Blueprint',
    description: 'A detailed roadmap for your business based on astrological insights and market trends.',
    price: 499.99,
    category: 'strategy',
    rating: 5.0,
    reviewCount: 42,
    imageUrl: '/placeholder.svg'
  },
  {
    id: '4',
    title: 'Monthly Alignment Check-in',
    description: 'Regular sessions to ensure your business stays aligned with the cosmic energies.',
    price: 79.99,
    category: 'subscription',
    rating: 4.7,
    reviewCount: 156,
    imageUrl: '/placeholder.svg'
  },
  {
    id: '5',
    title: 'Team Cosmic Harmony Workshop',
    description: 'Build a cohesive team by understanding individual cosmic profiles and how they complement each other.',
    price: 399.99,
    category: 'workshop',
    rating: 4.6,
    reviewCount: 67,
    imageUrl: '/placeholder.svg'
  },
  {
    id: '6',
    title: 'Decision-Making Astrology Guide',
    description: 'Learn how to time critical business decisions based on astrological insights.',
    price: 129.99,
    category: 'ebook',
    rating: 4.5,
    reviewCount: 93,
    imageUrl: '/placeholder.svg'
  }
];

// Categories for filtering
const categories = [
  { id: 'all', name: 'All Services' },
  { id: 'reading', name: 'Personal Readings' },
  { id: 'consulting', name: 'Consulting' },
  { id: 'strategy', name: 'Strategy' },
  { id: 'subscription', name: 'Subscriptions' },
  { id: 'workshop', name: 'Workshops' },
  { id: 'ebook', name: 'Digital Products' }
];

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filter products based on search term and category
  const filteredProducts = sampleProducts.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-dark bg-dark-gradient text-pi py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-elixia text-gradient mb-2">Cosmic Marketplace</h1>
          <p className="text-pi-muted max-w-3xl">
            Discover products and services designed to align your business with cosmic energies and
            maximize your potential for success and growth.
          </p>
        </div>

        {/* Featured Services Carousel */}
        <FeaturedServices />

        {/* Search and Filter */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pi-muted" />
              <Input
                type="text"
                placeholder="Search for products or services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-dark-secondary border-dark-accent"
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="text-xs"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onClick={() => handleProductClick(product)} 
            />
          ))}
        </div>

        {/* Product Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-dark-secondary border-dark-accent max-w-3xl">
            {selectedProduct && (
              <>
                <DialogTitle className="text-2xl font-elixia text-gradient">
                  {selectedProduct.title}
                </DialogTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="bg-dark rounded-lg overflow-hidden">
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.title} 
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <Star className="h-5 w-5 fill-yellow-500 text-yellow-500 mr-1" />
                      <span className="text-white font-medium">{selectedProduct.rating}</span>
                      <span className="text-pi-muted ml-1">({selectedProduct.reviewCount} reviews)</span>
                    </div>
                    <DialogDescription className="text-pi mb-4">
                      {selectedProduct.description}
                    </DialogDescription>
                    <div className="text-2xl font-medium text-white mb-6">
                      ${selectedProduct.price.toFixed(2)}
                    </div>
                    <Button className="w-full mb-2">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                    <Button variant="outline" className="w-full">
                      Buy Now
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Marketplace;
