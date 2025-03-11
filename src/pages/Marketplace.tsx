import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ShoppingCart, Star, QrCode, User, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ProductCard from '@/components/ProductCard';
import FeaturedServices from '@/components/FeaturedServices';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';

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

// Form validation schema
const emailFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [walletAddresses, setWalletAddresses] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [isConfirmingPurchase, setIsConfirmingPurchase] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: user?.email || '',
    },
  });

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

  const generateQRCode = (walletAddress: string) => {
    setShowQRCode(walletAddress);
  };

  const handlePurchase = (wallet: any) => {
    setSelectedWallet(wallet);
    setIsConfirmingPurchase(true);
  };

  const confirmPurchase = async (formData: EmailFormValues) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-purchase-confirmation', {
        body: {
          email: formData.email,
          productTitle: selectedProduct.title,
          productPrice: selectedProduct.price,
          walletAddress: selectedWallet.wallet_address,
          cryptoType: selectedWallet.crypto_type
        }
      });

      if (error) throw error;

      toast({
        title: "Purchase initiated",
        description: "A confirmation email has been sent with payment details.",
      });

      setIsConfirmingPurchase(false);
      navigator.clipboard.writeText(selectedWallet.wallet_address);
    } catch (error) {
      console.error('Error sending purchase confirmation:', error);
      toast({
        title: "Error processing purchase",
        description: "There was a problem sending the confirmation email. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper function to generate QR code URL
  const getQRCodeUrl = (text: string) => {
    // Using QR Server API which properly renders QR codes
    return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=200x200&bgcolor=ffffff`;
  };

  return (
    <div className="min-h-screen bg-dark bg-dark-gradient text-pi py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-elixia text-gradient mb-2">Cosmic Marketplace</h1>
            <p className="text-pi-muted max-w-3xl">
              Discover products and services designed to align your business with cosmic energies and
              maximize your potential for success and growth.
            </p>
          </div>
          
          {user && (
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => navigate('/dashboard')}
            >
              <User size={18} />
              <span className="hidden sm:inline">My Profile</span>
            </Button>
          )}
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
                  user_id: product.user_id,
                  title: product.title,
                  description: product.description,
                  price: product.price,
                  image_url: product.image_url,
                  category: product.category,
                }} 
                onClick={() => handleProductClick(product)} 
                showEditButton={true}
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
                                <div className="flex gap-2">
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
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => generateQRCode(wallet.wallet_address)}
                                  >
                                    <QrCode size={16} className="mr-1" />
                                    QR
                                  </Button>
                                </div>
                              </div>
                              {showQRCode === wallet.wallet_address && (
                                <div className="mt-2 flex justify-center bg-white p-2 rounded">
                                  <img 
                                    src={getQRCodeUrl(wallet.wallet_address)} 
                                    alt="QR Code" 
                                    className="h-32 w-32"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {isConfirmingPurchase ? (
                      <Form {...emailForm}>
                        <form onSubmit={emailForm.handleSubmit(confirmPurchase)} className="space-y-4">
                          <FormField
                            control={emailForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email for purchase confirmation</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="your@email.com" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex gap-2">
                            <Button type="submit" className="flex-1">
                              <Mail className="mr-2 h-4 w-4" />
                              Send Confirmation
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsConfirmingPurchase(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      <div className="flex gap-2">
                        {user && selectedProduct.user_id === user.id ? (
                          <Button 
                            className="w-full" 
                            onClick={() => {
                              setIsDialogOpen(false);
                              navigate(`/edit-product/${selectedProduct.id}`);
                            }}
                          >
                            Edit Product
                          </Button>
                        ) : (
                          walletAddresses[selectedProduct.id] && walletAddresses[selectedProduct.id].length > 0 ? (
                            <Button 
                              className="w-full" 
                              onClick={() => handlePurchase(walletAddresses[selectedProduct.id][0])}
                            >
                              Buy Now
                            </Button>
                          ) : (
                            <Button 
                              className="w-full" 
                              disabled
                            >
                              No Payment Option Available
                            </Button>
                          )
                        )}
                        <Button variant="outline" className="w-1/3" onClick={() => {
                          setShowQRCode(null);
                          setIsConfirmingPurchase(false);
                          setIsDialogOpen(false);
                        }}>
                          Close
                        </Button>
                      </div>
                    )}
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
