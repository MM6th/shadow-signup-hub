
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AppointmentDialog from "./AppointmentDialog";
import { useWalletAddresses } from "@/hooks/useWalletAddresses";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QrCode, Copy, Phone, Star, RefreshCw, CreditCard } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import ReviewDialog from "./ReviewDialog";
import { formatCurrency, convertPrice } from "@/lib/utils";
import PaymentDialog from "./PaymentDialog";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    description: string;
    price: number;
    image_url: string | null;
    user_id: string;
    category?: string; 
    type?: string;
    contact_phone?: string;
    price_currency?: string;
    original_price?: number;
    enable_paypal?: boolean;
    paypal_client_id?: string;
    enable_free_consultation?: boolean;
  };
  onClick?: () => void;
  showEditButton?: boolean;
  showBuyButton?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, showEditButton, showBuyButton = true }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(product.price_currency || 'usd');
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);
  const [fullProductData, setFullProductData] = useState<any>(null);
  const [selectedWalletAddress, setSelectedWalletAddress] = useState<any>(null);
  
  const ADMIN_EMAIL = "cmooregee@gmail.com";
  const isAdminUser = user?.email === ADMIN_EMAIL;
  const isService = product.type === 'service';
  const isVideoConsultation = product.type === 'video_consultation';
  
  const { adminWalletAddresses, hasPayPalEnabled, paypalClientId, isLoading } = useWalletAddresses(
    user, 
    product.id, 
    isAdminUser
  );
  
  // Derived properties
  const hasWalletAddresses = adminWalletAddresses && adminWalletAddresses.length > 0;
  const hasPaymentMethods = hasWalletAddresses || hasPayPalEnabled;
  
  useEffect(() => {
    // Set the first wallet address as the selected one when available
    if (adminWalletAddresses && adminWalletAddresses.length > 0) {
      setSelectedWalletAddress(adminWalletAddresses[0]);
    } else {
      setSelectedWalletAddress(null);
    }
  }, [adminWalletAddresses]);
  
  useEffect(() => {
    const fetchCompleteProductData = async () => {
      if (product.price > 0 || isLoading) return;
      
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', product.id)
          .single();
          
        if (error) throw error;
        if (data) {
          console.log("Fetched complete product data:", data);
          setFullProductData(data);
        }
      } catch (err) {
        console.error("Error fetching complete product data:", err);
      }
    };
    
    fetchCompleteProductData();
  }, [product.id, product.price, isLoading]);
  
  const displayProduct = fullProductData || product;
  
  useEffect(() => {
    console.log("Product card data:", {
      productId: product.id,
      productPrice: product.price,
      hasPayPalEnabled,
      paypalClientId,
      walletAddresses: adminWalletAddresses,
      displayProduct,
      contactPhone: product.contact_phone
    });
  }, [product.id, product.price, hasPayPalEnabled, paypalClientId, adminWalletAddresses, displayProduct]);
  
  useEffect(() => {
    setShowCurrencyConverter(hasWalletAddresses);
  }, [hasWalletAddresses]);

  useEffect(() => {
    if (hasWalletAddresses) {
      const fetchCryptoPrices = async () => {
        try {
          setIsLoadingPrices(true);
          const cryptoIds = 'bitcoin,ethereum,solana,cardano,polkadot,litecoin,usdc,bnb';
          const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd`);
          if (!response.ok) {
            throw new Error('Failed to fetch crypto prices');
          }
          const data = await response.json();
          
          const prices: Record<string, number> = {};
          Object.entries(data).forEach(([cryptoId, priceData]: [string, any]) => {
            prices[cryptoId] = priceData.usd;
          });
          
          prices['usd'] = 1;
          
          setCryptoPrices(prices);
        } catch (error) {
          console.error('Error fetching crypto prices:', error);
          setCryptoPrices({
            usd: 1,
            bitcoin: 65000,
            ethereum: 3500,
            solana: 140,
            cardano: 0.5,
            polkadot: 7,
            litecoin: 80,
            usdc: 1,
            bnb: 600
          });
        } finally {
          setIsLoadingPrices(false);
        }
      };

      fetchCryptoPrices();
    }
  }, [hasWalletAddresses]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/edit-product/${product.id}`);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const generateQRCode = (walletAddress: string) => {
    if (!walletAddress) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(walletAddress)}`;
  };

  const handleCopyWallet = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isLoading) {
      toast({
        title: "Loading payment options",
        description: "Please wait while we fetch payment information",
      });
      return;
    }
    
    if (!selectedWalletAddress && !hasPayPalEnabled) {
      toast({
        title: "Error",
        description: "No payment options available. Please contact the administrator.",
        variant: "destructive",
      });
      return;
    }

    if (hasPayPalEnabled || (!selectedWalletAddress && hasPayPalEnabled)) {
      setIsPaymentDialogOpen(true);
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedWalletAddress.wallet_address);
      
      let priceToPay = product.price;
      if (product.price_currency !== selectedWalletAddress.crypto_type) {
        const convertedPrice = convertPrice(
          product.original_price || product.price,
          product.price_currency || 'usd',
          selectedWalletAddress.crypto_type,
          cryptoPrices
        );
        if (convertedPrice !== null) {
          priceToPay = convertedPrice;
        }
      }
      
      await supabase.functions.invoke('send-purchase-confirmation', {
        body: {
          productTitle: product.title,
          productPrice: priceToPay,
          walletAddress: selectedWalletAddress.wallet_address,
          cryptoType: selectedWalletAddress.crypto_type,
          contactPhone: product.contact_phone || "Not provided"
        },
      });

      toast({
        title: "Payment address copied!",
        description: `Send ${priceToPay.toFixed(6)} ${selectedWalletAddress.crypto_type.toUpperCase()} to the copied address to complete your purchase. Contact the seller at ${product.contact_phone || "unknown"} after payment.`,
      });
    } catch (error) {
      console.error('Error processing:', error);
      toast({
        title: "Error",
        description: "Failed to copy payment address",
        variant: "destructive",
      });
    }
  };

  const handleShowPaymentOptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isVideoConsultation) {
      if (product.enable_free_consultation) {
        setIsSchedulerOpen(true);
        return;
      }
    }
    
    setIsPaymentDialogOpen(true);
  };

  const handleSchedulingComplete = () => {
    setIsSchedulerOpen(false);
    toast({
      title: "Appointment Scheduled",
      description: "Your appointment has been successfully scheduled. Check your dashboard for details.",
    });
  };

  const handleOpenReviewDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to leave a review.",
        variant: "destructive",
      });
      return;
    }
    setIsReviewDialogOpen(true);
  };

  const handleScheduleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isVideoConsultation && product.enable_free_consultation) {
      toast({
        title: "Free Consultation Available",
        description: "This product offers free consultation sessions. Schedule one now?",
      });
    }
    
    setIsSchedulerOpen(true);
  };
  
  const handleShowQR = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowQRCode(!showQRCode);
  };
  
  const handleContactSeller = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.contact_phone) {
      toast({
        title: "Seller Contact",
        description: `Contact the seller at: ${product.contact_phone}`,
      });
    } else {
      toast({
        title: "Contact Information Unavailable",
        description: "No contact information provided for this seller.",
        variant: "destructive",
      });
    }
  };
  
  const handleChangeCurrency = (currency: string) => {
    setSelectedCurrency(currency);
  };

  const qrCodeUrl = selectedWalletAddress ? generateQRCode(selectedWalletAddress.wallet_address) : '';
  
  const displayPrice = () => {
    const baseCurrency = displayProduct.price_currency || 'usd';
    const basePrice = displayProduct.original_price || displayProduct.price;
    
    if (selectedCurrency === baseCurrency) {
      return formatCurrency(basePrice, baseCurrency);
    }
    
    const converted = convertPrice(basePrice, baseCurrency, selectedCurrency, cryptoPrices);
    if (converted === null) {
      return `${formatCurrency(basePrice, baseCurrency)} (conversion unavailable)`;
    }
    
    return formatCurrency(converted, selectedCurrency);
  };

  if (isVideoConsultation) {
    const VideoConsultationCard = require('./VideoConsultationCard').default;
    return (
      <VideoConsultationCard
        product={displayProduct}
        onClick={onClick}
        showEditButton={showEditButton}
      />
    );
  }

  return (
    <Card 
      className="overflow-hidden h-[600px] flex flex-col"
      onClick={handleCardClick}
    >
      <div className="relative h-96 overflow-hidden">
        {displayProduct.image_url ? (
          <img
            src={displayProduct.image_url}
            alt={displayProduct.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            No Image
          </div>
        )}
      </div>
      
      <CardContent className="p-4 flex flex-col flex-grow" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2">{displayProduct.title}</h3>
        <p className="text-gray-600 mb-4 flex-grow overflow-y-auto">
          {displayProduct.description}
        </p>
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg font-bold">
              {isLoadingPrices ? (
                <span className="flex items-center">
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Loading...
                </span>
              ) : (
                displayPrice()
              )}
              {displayProduct.type === 'service' ? '/hr' : ''}
            </p>
            
            {showCurrencyConverter && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <RefreshCw size={16} className="mr-1" />
                    Convert
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-2 w-48">
                  <div className="text-sm font-medium mb-2">Display price in:</div>
                  <div className="space-y-1">
                    <Button 
                      variant={selectedCurrency === 'usd' ? 'default' : 'ghost'} 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => handleChangeCurrency('usd')}
                    >
                      USD ($)
                    </Button>
                    {Object.keys(cryptoPrices).filter(key => key !== 'usd').map(crypto => (
                      <Button
                        key={crypto}
                        variant={selectedCurrency === crypto ? 'default' : 'ghost'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleChangeCurrency(crypto)}
                      >
                        {crypto.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          
          {displayProduct.contact_phone && (
            <div className="text-sm text-gray-600 mb-2 flex items-center">
              <Phone size={14} className="mr-1" /> {displayProduct.contact_phone}
            </div>
          )}
          
          {isAdminUser && (showEditButton !== false) ? (
            <Button onClick={handleEdit} className="w-full">
              Edit
            </Button>
          ) : isService ? (
            <Button onClick={handleScheduleClick} className="w-full">
              Schedule Appointment
            </Button>
          ) : showBuyButton ? (
            <div className="space-y-2">
              {isLoading ? (
                <Button disabled className="w-full">
                  <RefreshCw size={16} className="animate-spin mr-2" /> Loading...
                </Button>
              ) : hasPaymentMethods ? (
                <Button onClick={handleShowPaymentOptions} className="w-full">
                  {hasPayPalEnabled ? (
                    <>
                      <CreditCard size={16} className="mr-2" /> Pay Now
                    </>
                  ) : (
                    <>
                      <Copy size={16} className="mr-2" /> Buy Now
                    </>
                  )}
                </Button>
              ) : (
                <Button disabled className="w-full">
                  No Payment Methods
                </Button>
              )}
              
              <div className="flex justify-between">
                {hasWalletAddresses && (
                  <Popover open={showQRCode} onOpenChange={setShowQRCode}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" onClick={handleShowQR}>
                        <QrCode size={16} className="mr-2" /> Show QR
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="bg-white p-2 w-auto">
                      {qrCodeUrl ? (
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code" 
                          className="h-32 w-32"
                        />
                      ) : (
                        <div className="h-32 w-32 flex items-center justify-center text-sm text-gray-500">
                          No wallet address available
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                )}
                
                <Button variant="outline" size="sm" onClick={handleOpenReviewDialog} className={hasWalletAddresses ? "" : "w-full"}>
                  <Star size={16} className="mr-2" /> Review
                </Button>
              </div>

              {displayProduct.contact_phone && (
                <Button variant="outline" size="sm" onClick={handleContactSeller} className="w-full">
                  <Phone size={16} className="mr-1" /> Contact Seller
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </CardContent>

      <AppointmentDialog
        open={isSchedulerOpen}
        onOpenChange={setIsSchedulerOpen}
        productId={product.id}
        productTitle={product.title}
        sellerId={product.user_id}
        onSchedulingComplete={handleSchedulingComplete}
        user={user}
        isFreeConsultation={isVideoConsultation && product.enable_free_consultation}
      />

      <ReviewDialog
        open={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
        productId={product.id}
        sellerId={product.user_id}
        user={user}
      />

      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        product={{
          id: product.id,
          title: product.title,
          price: product.price,
          enable_paypal: hasPayPalEnabled,
          paypal_client_id: paypalClientId || undefined,
          contact_phone: displayProduct.contact_phone
        }}
        walletData={selectedWalletAddress}
      />
    </Card>
  );
};

export default ProductCard;
