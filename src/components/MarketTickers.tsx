import React, { useState } from 'react';
import { useToken } from '../context/TokenContext';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { binanceWS, TokenPrice } from '../services/binanceWebSocket';
import { cryptoLogos } from '../utils/cryptoLogos';

interface MarketTickersProps {
  onNavigateToFutures: () => void;
}

const MarketTickers: React.FC<MarketTickersProps> = ({ onNavigateToFutures }) => {
  const [tokens, setTokens] = React.useState<TokenPrice[]>([]);
  const { setSelectedToken } = useToken();

  React.useEffect(() => {
    const unsubscribe = binanceWS.onPriceUpdate((data) => {
      setTokens(data);
    });
    return () => unsubscribe();
  }, []);

  const sortedTokens = tokens
    .sort((a, b) => (b.price * b.volume) - (a.price * a.volume));

  const getTokenSymbol = (symbol: string) => symbol.replace('USDT', '');

  const handleTrade = (symbol: string) => {
    setSelectedToken(symbol);
    if (onNavigateToFutures) {
      onNavigateToFutures();
    }
  };

  return (
    <div className="flex flex-col">
      {/* Banner */}
      <div className="relative w-full h-48 overflow-hidden">
        <img 
          src="https://images.pexels.com/photos/7788009/pexels-photo-7788009.jpeg"
          alt="Trading Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0F172A]" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h1 className="text-2xl font-bold mb-2">EVEX</h1>
          <p className="text-sm text-gray-300">
            A CRYPTO FINANCIAL INFRASTRUCTURE BUILT FOR PROFESSIONAL INVESTORS
          </p>
        </div>
      </div>

      {/* Market Overview */}
      <div className="px-4 py-2">
        <div className="grid grid-cols-3 gap-4 mb-4">
          {sortedTokens.slice(0, 3).map((token) => {
            const symbol = getTokenSymbol(token.symbol);
            const logo = cryptoLogos[symbol];
            const isPositive = token.priceChange >= 0;
            
            return (
              <div 
                key={token.symbol}
                className={`p-3 rounded-lg transition-colors ${
                  isPositive 
                    ? 'bg-[#22C55E] bg-opacity-10 border border-[#22C55E] border-opacity-20' 
                    : 'bg-[#EF4444] bg-opacity-10 border border-[#EF4444] border-opacity-20'
                }`}
              >
                <div className="flex items-center mb-1">
                  {logo ? (
                    <img 
                      src={logo} 
                      alt={symbol} 
                      className="w-6 h-6 rounded-full mr-2"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs mr-2">
                      {symbol.substring(0, 1)}
                    </div>
                  )}
                  <div className="text-sm font-medium">{symbol}</div>
                </div>
                <div className={`text-xs ${isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {formatPercentage(token.priceChange)}
                </div>
                <div className="font-mono text-sm mt-1">
                  {formatCurrency(token.price)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Market Table */}
        <div className="bg-[#1E293B] rounded-lg overflow-hidden">
          <div className="p-3 border-b border-gray-700">
            <h2 className="font-medium">Hot Markets</h2>
          </div>
          <div className="divide-y divide-gray-700">
            {sortedTokens.map((token) => {
              const symbol = getTokenSymbol(token.symbol);
              const logo = cryptoLogos[symbol];
              
              return (
                <div 
                  key={token.symbol}
                  className="flex items-center justify-between p-3"
                >
                  <div className="flex items-center">
                    {logo ? (
                      <img 
                        src={logo} 
                        alt={symbol} 
                        className="w-8 h-8 rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-lg mr-3">
                        {symbol.substring(0, 1)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{symbol}</div>
                      <div className={`text-sm ${
                        token.priceChange > 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                      }`}>
                        {formatPercentage(token.priceChange)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">
                      {formatCurrency(token.price)}
                    </div>
                    <button
                      onClick={() => handleTrade(token.symbol)}
                      className="mt-1 bg-[#22C55E] hover:bg-[#16A34A] text-white px-3 py-1 rounded text-sm"
                    >
                      Trade
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketTickers;