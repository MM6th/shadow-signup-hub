import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/ProductCard";
import { useProduct } from "@/hooks/useProduct";
import { Search, Filter } from 'lucide-react';
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import LiveSessionCard from '@/components/LiveSessionCard';
import { useLiveSessions } from '@/hooks/useLiveSessions';

const Marketplace = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, isLoading, fetchProducts } = useProduct();
  const { liveSessions } = useLiveSessions();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  
  useEffect(() => {
    fetchProducts(searchTerm, categoryFilter, typeFilter);
  }, [searchTerm, categoryFilter, typeFilter]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    // Update search params
    searchParams.set('search', term);
    setSearchParams(searchParams);
  };
  
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    
    // Update search params
    searchParams.set('category', value);
    setSearchParams(searchParams);
  };
  
  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    
    // Update search params
    searchParams.set('type', value);
    setSearchParams(searchParams);
  };
  
  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      
      <div className="bg-pi-base py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white font-elixia text-center">
            Discover Products
          </h1>
          <p className="text-pi-muted text-center mt-4">
            Explore a wide range of products from our community
          </p>
          
          <div className="flex items-center mt-8 max-w-3xl mx-auto">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search for products..."
                className="rounded-full pl-12 pr-4 py-3 bg-pi-secondary border-none text-white focus-visible:ring-2 focus-visible:ring-pi-focus"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-pi-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-elixia text-gradient">
              All Products
            </h2>
            
            <div className="flex items-center space-x-2 text-pi-muted">
              <Filter className="h-4 w-4" />
              <span className="text-sm">Filters:</span>
              
              <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                <SelectTrigger className="bg-pi-secondary text-pi-muted border-none rounded-md h-9">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-pi-secondary text-pi-muted border-none rounded-md">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="home">Home & Garden</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                  <SelectItem value="sports">Sports & Outdoors</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={handleTypeChange}>
                <SelectTrigger className="bg-pi-secondary text-pi-muted border-none rounded-md h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-pi-secondary text-pi-muted border-none rounded-md">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button variant="outline" onClick={() => navigate('/create-product')}>
            Create Product
          </Button>
        </div>
        
        {liveSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-elixia text-gradient mb-4">
              Live Sessions
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {liveSessions.map((session) => (
                <LiveSessionCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}
        
        <h2 className="text-2xl font-elixia text-gradient mb-4">
          All Products
        </h2>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card p-4 h-64 animate-pulse" />
              ))}
            </>
          ) : products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="glass-card p-6 text-center">
              <h3 className="text-lg font-medium mb-2">No Products Found</h3>
              <p className="text-pi-muted">
                No products match your search criteria.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Marketplace;
