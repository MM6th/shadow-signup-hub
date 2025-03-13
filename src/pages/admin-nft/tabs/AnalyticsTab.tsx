
import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { NFT } from '@/hooks/useNFT';

interface AnalyticsTabProps {
  nfts: NFT[];
  salesData: { date: string; sales: number }[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ nfts, salesData }) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Total NFTs</h3>
          <div className="flex items-center">
            <span className="text-3xl font-bold">{nfts.length}</span>
            <span className="ml-2 text-xs px-2 py-1 rounded bg-green-900/30 text-green-400">
              <ChevronUp size={14} className="inline mr-1" />
              {Math.floor(Math.random() * 20) + 5}%
            </span>
          </div>
          <p className="text-xs text-pi-muted mt-2">Compared to last month</p>
        </div>
        
        <div className="glass-card p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Listed NFTs</h3>
          <div className="flex items-center">
            <span className="text-3xl font-bold">
              {nfts.filter(nft => nft.status === 'listed').length}
            </span>
            <span className="ml-2 text-xs px-2 py-1 rounded bg-green-900/30 text-green-400">
              <ChevronUp size={14} className="inline mr-1" />
              {Math.floor(Math.random() * 10) + 10}%
            </span>
          </div>
          <p className="text-xs text-pi-muted mt-2">Compared to last month</p>
        </div>
        
        <div className="glass-card p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Total Revenue</h3>
          <div className="flex items-center">
            <span className="text-3xl font-bold">{(Math.random() * 10).toFixed(2)} ETH</span>
            <span className="ml-2 text-xs px-2 py-1 rounded bg-red-900/30 text-red-400">
              <ChevronDown size={14} className="inline mr-1" />
              {Math.floor(Math.random() * 10)}%
            </span>
          </div>
          <p className="text-xs text-pi-muted mt-2">Compared to last month</p>
        </div>
      </div>
      
      <div className="glass-card p-6 rounded-lg">
        <h3 className="text-xl font-medium mb-4">Sales Overview</h3>
        <div className="h-64 w-full">
          <div className="flex items-end h-full w-full space-x-1">
            {salesData.map((data, i) => (
              <div key={i} className="relative group flex-1 h-full flex flex-col justify-end">
                <div 
                  className="bg-gradient-to-t from-pi-focus to-purple-500 rounded-t w-full"
                  style={{ height: `${data.sales * 10}%` }}
                ></div>
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 w-full text-center">
                  <div className="bg-black/70 text-white text-xs py-1 px-2 rounded">
                    {data.sales} sales on {data.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-pi-muted">
          <span>{salesData[0]?.date}</span>
          <span>{salesData[salesData.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  );
};
