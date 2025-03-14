
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return format(date, 'MMM dd, yyyy')
}

// Utility function to format currency values with appropriate symbols
export function formatCurrency(value: number, currency: string = 'usd'): string {
  const symbols: Record<string, string> = {
    usd: '$',
    bitcoin: '₿',
    ethereum: 'Ξ',
    solana: 'SOL',
    cardano: 'ADA',
    polkadot: 'DOT',
    litecoin: 'LTC',
    usdc: 'USDC',
    bnb: 'BNB'
  };

  const symbol = symbols[currency.toLowerCase()] || currency.toUpperCase();
  
  // For cryptocurrencies, show more decimal places
  const decimals = ['usd', 'usdc'].includes(currency.toLowerCase()) ? 2 : 6;
  
  return `${symbol}${value.toFixed(decimals)}`;
}

// Convert price between currencies using exchange rates
export function convertPrice(
  price: number, 
  fromCurrency: string, 
  toCurrency: string, 
  exchangeRates: Record<string, number>
): number | null {
  if (!price || !fromCurrency || !toCurrency || !exchangeRates) return null;
  
  // If currencies are the same, return the original price
  if (fromCurrency === toCurrency) return price;
  
  // For USD to crypto conversion
  if (fromCurrency === 'usd') {
    const cryptoRate = exchangeRates[toCurrency];
    if (!cryptoRate) return null;
    return price / cryptoRate;
  }
  
  // For crypto to USD conversion
  if (toCurrency === 'usd') {
    const cryptoRate = exchangeRates[fromCurrency];
    if (!cryptoRate) return null;
    return price * cryptoRate;
  }
  
  // For crypto to crypto conversion
  const sourceRate = exchangeRates[fromCurrency];
  const targetRate = exchangeRates[toCurrency];
  if (!sourceRate || !targetRate) return null;
  
  // Convert to USD first, then to target crypto
  const usdValue = price * sourceRate;
  return usdValue / targetRate;
}
