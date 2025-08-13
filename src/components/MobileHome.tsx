import React, { useState, useEffect } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { binanceWS, TokenPrice } from '../services/binanceWebSocket';
import { formatCurrency } from '../utils/formatters';
import { cryptoLogos } from '../utils/cryptoLogos';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import ConvertModal from './ConvertModal';
import { usePositions } from '../context/PositionContext';

interface MobileHomeProps {
  onNavigateToFutures: () => void;
}

const MobileHome: React.FC<MobileHomeProps> = ({ onNavigateToFutures }) => {
  const [tokens, setTokens] = useState<TokenPrice[]>([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [activeMarketTab, setActiveMarketTab] = useState('change');
  const { tokenBalances } = usePositions();

  useEffect(() => {
    const unsubscribe = binanceWS.onPriceUpdate((data) => {
      setTokens(data);
    });
    return () => unsubscribe();
  }, []);

  const getTokenSymbol = (symbol: string) => symbol.replace('USDT', '');

  // Get top 3 tokens for hero section
  const heroTokens = tokens
    .filter(token => ['BTCUSDT', 'ETHUSDT', 'TRXUSDT'].includes(token.symbol))
    .sort((a, b) => (b.price * b.volume) - (a.price * a.volume));

  // Generate sparkline data
  const generateSparklineData = () => {
    const points = [];
    let value = 50;
    for (let i = 0; i < 20; i++) {
      value += (Math.random() - 0.5) * 10;
      value = Math.max(10, Math.min(90, value));
      points.push(value);
    }
    return points;
  };

  const getMarketData = () => {
    switch (activeMarketTab) {
      case 'change':
        return tokens.sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange)).slice(0, 10);
      case 'losers':
        return tokens.filter(t => t.priceChange < 0).sort((a, b) => a.priceChange - b.priceChange).slice(0, 10);
      case 'turnover':
        return tokens.sort((a, b) => (b.price * b.volume) - (a.price * a.volume)).slice(0, 10);
      default:
        return tokens.slice(0, 10);
    }
  };

  return (
    <div className="bg-[#0F172A] min-h-screen">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 p-6 text-white">
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        <div className="relative z-10">
          <div className="text-center mb-4">
            <h1 className="text-lg font-bold mb-1">PROFESSIONAL-LEVEL DIGITAL</h1>
            <h2 className="text-xl font-bold mb-1">ASSET TRADING PLATFORM - TXEX</h2>
            <p className="text-sm opacity-90 mb-2">A CRYPTO FINANCIAL INFRASTRUCTURE BUILT FOR</p>
            <p className="text-sm opacity-90 mb-4">PROFESSIONAL INVESTORS</p>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">₿</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">TX</div>
            </div>
          </div>
          
          <div className="bg-black bg-opacity-20 rounded-lg p-3 mb-4">
            <div className="flex items-center text-yellow-300 text-sm">
              <span className="mr-2">⚠️</span>
              <span>TXEX demonstrates commitment to legal and...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Price Cards */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-1 gap-3 mb-6">
          {heroTokens.map((token) => {
            const symbol = getTokenSymbol(token.symbol);
            const logo = cryptoLogos[symbol];
            const isPositive = token.priceChange >= 0;
            const sparklineData = generateSparklineData();
            
            const pathData = sparklineData.map((point, index) => 
              `${index === 0 ? 'M' : 'L'} ${(index / (sparklineData.length - 1)) * 80} ${30 - (point / 100) * 20}`
            ).join(' ');
            
            return (
              <div key={token.symbol} className="bg-[#1E293B] rounded-lg p-4 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      isPositive ? 'bg-[#22C55E] text-white' : 'bg-[#EF4444] text-white'
                    }`}>
                      {isPositive ? '+' : ''}{token.priceChange.toFixed(2)}%
                    </span>
                    <span className="ml-3 font-medium">{symbol}USDT</span>
                  </div>
                  <div className="w-20 h-8">
                    <svg width="80" height="30" className="w-full h-full">
                      <path
                        d={pathData}
                        stroke={isPositive ? '#22C55E' : '#EF4444'}
                        strokeWidth="1.5"
                        fill="none"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {token.price < 1 
                    ? token.price.toFixed(6)
                    : token.price.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })
                  }
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="flex flex-col items-center p-4 bg-[#1E293B] rounded-lg hover:bg-[#2D3748] transition-colors"
          >
            <div className="w-12 h-12 bg-[#EF4444] bg-opacity-20 rounded-full flex items-center justify-center mb-2">
              <ArrowUpFromLine className="w-6 h-6 text-[#EF4444]" />
            </div>
            <span className="text-sm">Withdrawal</span>
          </button>
          
          <button 
            onClick={() => setShowDepositModal(true)}
            className="flex flex-col items-center p-4 bg-[#1E293B] rounded-lg hover:bg-[#2D3748] transition-colors"
          >
            <div className="w-12 h-12 bg-[#22C55E] bg-opacity-20 rounded-full flex items-center justify-center mb-2">
              <ArrowDownToLine className="w-6 h-6 text-[#22C55E]" />
            </div>
            <span className="text-sm">Deposit</span>
          </button>
          
          <button 
            onClick={() => setShowConvertModal(true)}
            className="flex flex-col items-center p-4 bg-[#1E293B] rounded-lg hover:bg-[#2D3748] transition-colors"
          >
            <div className="w-12 h-12 bg-[#F59E0B] bg-opacity-20 rounded-full flex items-center justify-center mb-2">
              <ArrowLeftRight className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <span className="text-sm">Convert</span>
          </button>
          
          <button className="flex flex-col items-center p-4 bg-[#1E293B] rounded-lg hover:bg-[#2D3748] transition-colors">
            <div className="w-12 h-12 bg-[#3B82F6] bg-opacity-20 rounded-full flex items-center justify-center mb-2">
              <MoreHorizontal className="w-6 h-6 text-[#3B82F6]" />
            </div>
            <span className="text-sm">More</span>
          </button>
        </div>

        {/* Quick Buy Section */}
        <div className="bg-gradient-to-r from-[#22C55E] to-[#16A34A] rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold mb-1">Quickly buy coins</h3>
              <p className="text-white text-sm opacity-90">Safe and convenient</p>
            </div>
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-white">→</span>
            </div>
          </div>
        </div>

        {/* Market Tabs */}
        <div className="mb-4">
          <div className="flex space-x-6 border-b border-gray-700">
            <button
              onClick={() => setActiveMarketTab('change')}
              className={`pb-2 text-sm font-medium ${
                activeMarketTab === 'change' 
                  ? 'text-[#22C55E] border-b-2 border-[#22C55E]' 
                  : 'text-gray-400'
              }`}
            >
              Change
            </button>
            <button
              onClick={() => setActiveMarketTab('losers')}
              className={`pb-2 text-sm font-medium ${
                activeMarketTab === 'losers' 
                  ? 'text-[#22C55E] border-b-2 border-[#22C55E]' 
                  : 'text-gray-400'
              }`}
            >
              Top Losers
            </button>
            <button
              onClick={() => setActiveMarketTab('turnover')}
              className={`pb-2 text-sm font-medium ${
                activeMarketTab === 'turnover' 
                  ? 'text-[#22C55E] border-b-2 border-[#22C55E]' 
                  : 'text-gray-400'
              }`}
            >
              24h turnover
            </button>
          </div>
        </div>

        {/* Market Table Headers */}
        <div className="flex justify-between items-center mb-2 px-2">
          <span className="text-gray-400 text-sm">Pair</span>
          <span className="text-gray-400 text-sm">Price</span>
          <span className="text-gray-400 text-sm">24h change</span>
        </div>

        {/* Market List */}
        <div className="space-y-2">
          {getMarketData().map((token) => {
            const symbol = getTokenSymbol(token.symbol);
            const logo = cryptoLogos[symbol];
            const isPositive = token.priceChange >= 0;
            
            return (
              <div key={token.symbol} className="flex items-center justify-between p-3 bg-[#1E293B] rounded-lg">
                <div className="flex items-center">
                  {logo ? (
                    <img src={logo} alt={symbol} className="w-8 h-8 rounded-full mr-3" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white mr-3 text-sm">
                      {symbol[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{symbol}</div>
                    <div className="text-xs text-gray-400">/ USDT</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-mono text-sm">
                    {token.price < 1 ? token.price.toFixed(6) : token.price.toFixed(2)}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    isPositive ? 'bg-[#22C55E] text-white' : 'bg-[#EF4444] text-white'
                  }`}>
                    {isPositive ? '+' : ''}{token.priceChange.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
      />

      <ConvertModal 
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        prices={tokens}
        tokenBalances={tokenBalances}
      />
    </div>
  );
};

export default MobileHome;