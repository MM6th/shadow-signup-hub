
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ProductCard from '@/components/ProductCard';
import FeaturedServices from '@/components/FeaturedServices';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [walletAddresses, setWalletAddresses] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setProducts(data || []);
        
        // Fetch wallet addresses for all products
        if (data && data.length > 0) {
          const productIds = data.map(product => product.id);
          const { data: walletData, error: walletError } = await supabase
            .from('wallet_addresses')
            .select('*')
            .in('product_id', productIds);
            
          if (walletError) throw walletError;
          
          // Group wallet addresses by product_id
          const walletsByProduct = (walletData || []).reduce((acc: any, wallet: any) => {
            if (!acc[wallet.product_id]) {
              acc[wallet.product_id] = [];
            }
            acc[wallet.product_id].push(wallet);
            return acc;
          }, {});
          
          setWalletAddresses(walletsByProduct);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error loading products",
          description: "There was a problem loading the products. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, [toast]);

  // Filter products based on search term and category
  const filteredProducts = products.filter(product => {
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
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-12 w-12 border-4 border-pi-focus rounded-full border-t-transparent"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-pi-muted mb-4" />
            <h2 className="text-2xl font-medium mb-2">No Products Found</h2>
            <p className="text-pi-muted mb-6">
              {searchTerm || selectedCategory !== 'all' 
                ? "No products match your current filters. Try adjusting your search criteria."
                : "There are no products available in the marketplace yet."}
            </p>
            <Button onClick={() => navigate('/create-product')}>Create Your Own Product</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={{
                  id: product.id,
                  title: product.title,
                  description: product.description,
                  price: product.price,
                  category: product.category,
                  rating: 5.0, // Default rating for now
                  reviewCount: 0, // Default review count for now
                  imageUrl: product.image_url || '/placeholder.svg'
                }} 
                onClick={() => handleProductClick(product)} 
              />
            ))}
          </div>
        )}

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
                      src={selectedProduct.image_url || '/placeholder.svg'} 
                      alt={selectedProduct.title} 
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <Star className="h-5 w-5 fill-yellow-500 text-yellow-500 mr-1" />
                      <span className="text-white font-medium">5.0</span>
                      <span className="text-pi-muted ml-1">(New)</span>
                    </div>
                    <DialogDescription className="text-pi mb-4">
                      {selectedProduct.description}
                    </DialogDescription>
                    <div className="text-2xl font-medium text-white mb-6">
                      ${selectedProduct.price.toFixed(2)}
                    </div>
                    
                    {/* Payment Options */}
                    {walletAddresses[selectedProduct.id] && walletAddresses[selectedProduct.id].length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium mb-2">Payment Options:</h3>
                        <div className="space-y-2">
                          {walletAddresses[selectedProduct.id].map((wallet: any) => (
                            <div key={wallet.id} className="p-3 rounded bg-dark">
                              <p className="text-sm font-medium capitalize">{wallet.crypto_type}</p>
                              <div className="flex items-center">
                                <code className="text-xs text-gray-400 truncate flex-1">
                                  {wallet.wallet_address}
                                </code>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(wallet.wallet_address);
                                    toast({
                                      title: "Address copied",
                                      description: `${wallet.crypto_type} wallet address copied to clipboard`,
                                    });
                                  }}
                                >
                                  Copy
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button className="w-full" onClick={() => {
                        if (walletAddresses[selectedProduct.id] && walletAddresses[selectedProduct.id].length > 0) {
                          navigator.clipboard.writeText(walletAddresses[selectedProduct.id][0].wallet_address);
                          toast({
                            title: "Payment information",
                            description: "Wallet address copied to clipboard. Send payment to complete your purchase.",
                          });
                        } else {
                          toast({
                            title: "No payment information",
                            description: "This product doesn't have payment information available.",
                            variant: "destructive",
                          });
                        }
                      }}>
                        Buy Now
                      </Button>
                      <Button variant="outline" className="w-1/3" onClick={() => setIsDialogOpen(false)}>
                        Close
                      </Button>
                    </div>
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
