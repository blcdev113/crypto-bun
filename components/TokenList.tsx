import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { binanceWS, TokenPrice } from '../services/binanceWebSocket';
import { useToken } from '../context/TokenContext';
import { cryptoLogos } from '../utils/cryptoLogos';

interface TokenListProps {
  onSelect?: (token: string) => void;
}

const TokenList: React.FC<TokenListProps> = ({ onSelect }) => {
  const [tokens, setTokens] = useState<TokenPrice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('marketCap');
  const [sortDirection, setSortDirection] = useState('desc');
  const [previousPrices, setPreviousPrices] = useState<Map<string, number>>(new Map());
  const { selectedToken, setSelectedToken } = useToken();
  
  useEffect(() => {
    const unsubscribe = binanceWS.onPriceUpdate((data) => {
      setTokens(prevTokens => {
        const newPreviousPrices = new Map(previousPrices);
        prevTokens.forEach(token => {
          newPreviousPrices.set(token.symbol, token.price);
        });
        setPreviousPrices(newPreviousPrices);
        return data;
      });
    });

    return () => unsubscribe();
  }, []);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const getPriceChangeClass = (symbol: string, currentPrice: number) => {
    const previousPrice = previousPrices.get(symbol);
    if (!previousPrice) return '';
    return currentPrice > previousPrice ? 'text-green-500' : currentPrice < previousPrice ? 'text-red-500' : '';
  };

  const handleTokenSelect = (token: string) => {
    setSelectedToken(token);
    if (onSelect) {
      onSelect(token);
    }
  };

  const sortedTokens = [...tokens].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortBy) {
      case 'symbol':
        return direction * a.symbol.localeCompare(b.symbol);
      case 'price':
        return direction * (a.price - b.price);
      case 'priceChange':
        return direction * (a.priceChange - b.priceChange);
      case 'marketCap':
        const marketCapA = a.price * a.volume;
        const marketCapB = b.price * b.volume;
        return direction * (marketCapA - marketCapB);
      default:
        return 0;
    }
  });

  const filteredTokens = sortedTokens.filter(token => 
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTokenSymbol = (symbol: string) => symbol.replace('USDT', '');

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-gray-700">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 text-white px-3 py-2 pl-9 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          />
          <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="bg-gray-750 sticky top-0">
            <tr className="text-gray-400 text-xs">
              <th 
                className="px-3 py-2 text-left cursor-pointer hover:text-white"
                onClick={() => handleSort('symbol')}
              >
                Pair
              </th>
              <th 
                className="px-3 py-2 text-right cursor-pointer hover:text-white"
                onClick={() => handleSort('price')}
              >
                Price
              </th>
              <th 
                className="px-3 py-2 text-right cursor-pointer hover:text-white"
                onClick={() => handleSort('priceChange')}
              >
                24h
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTokens.map((token) => {
              const symbol = getTokenSymbol(token.symbol);
              const logo = cryptoLogos[symbol];
              
              return (
                <tr 
                  key={token.symbol}
                  className={`border-b border-gray-700 hover:bg-gray-750 cursor-pointer transition-colors ${
                    selectedToken === token.symbol ? 'bg-gray-700' : ''
                  }`}
                  onClick={() => handleTokenSelect(token.symbol)}
                >
                  <td className="px-3 py-3 flex items-center">
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
                    <div>
                      <div className="font-medium">{symbol}</div>
                      <div className="text-xs text-gray-400">USDT</div>
                    </div>
                  </td>
                  <td className={`px-3 py-3 text-right ${getPriceChangeClass(token.symbol, token.price)}`}>
                    {formatCurrency(token.price)}
                  </td>
                  <td className={`px-3 py-3 text-right ${
                    token.priceChange > 0 ? 'text-green-500' : token.priceChange < 0 ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {token.priceChange !== undefined ? formatPercentage(token.priceChange) : '0.00%'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TokenList;