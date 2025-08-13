import React, { useState, useEffect } from 'react';
import { Info, Clock, Wallet, TrendingUp, ChevronDown, Eye, EyeOff, X, Minus, Plus, Search } from 'lucide-react';
import { binanceWS } from '../services/binanceWebSocket';
import { formatCurrency } from '../utils/formatters';
import { useToken } from '../context/TokenContext';
import { usePositions } from '../context/PositionContext';
import { cryptoLogos } from '../utils/cryptoLogos';
import TradingChart from './TradingChart';
import OrderBook from './OrderBook';
import TokenList from './TokenList';

const TIME_OPTIONS = [
  { label: '60s', value: 60, display: '60s' },
  { label: '120s', value: 120, display: '120s' },
  { label: '5min', value: 300, display: '5min' },
  { label: '10min', value: 600, display: '10min' }
];

const AMOUNT_PERCENTAGES = [
  { label: '1%', value: 0.01 },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1.0 }
];

interface BinaryTrade {
  id: string;
  symbol: string;
  type: 'call' | 'put';
  amount: number;
  entryPrice: number;
  expiryTime: Date;
  duration: number;
  status: 'pending' | 'active' | 'won' | 'lost';
  payout?: number;
  scheduledTime?: Date;
}

const TradingSection: React.FC = () => {
  const { selectedToken, setSelectedToken } = useToken();
  const { portfolioBalance, updateUsdtBalance, tokenBalances } = usePositions();
  const [tradeType, setTradeType] = useState<'call' | 'put'>('call');
  const [selectedTime, setSelectedTime] = useState(60);
  const [tradeAmount, setTradeAmount] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tokens, setTokens] = useState<any[]>([]);
  const [activeTrades, setActiveTrades] = useState<BinaryTrade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<BinaryTrade[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history'>('pending');
  const [selectedScheduledTime, setSelectedScheduledTime] = useState('');
  const [pendingTrades, setPendingTrades] = useState<BinaryTrade[]>([]);

  // Generate time options for the next hour
  const generateTimeOptions = () => {
    const now = new Date();
    const options = [];
    
    // Start from next 5-minute interval
    const nextInterval = new Date(now);
    nextInterval.setMinutes(Math.ceil(now.getMinutes() / 5) * 5, 0, 0);
    
    // Generate 12 options (next hour in 5-minute intervals)
    for (let i = 0; i < 12; i++) {
      const time = new Date(nextInterval.getTime() + (i * 5 * 60 * 1000));
      const timeString = time.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      options.push({
        value: time.toISOString(),
        label: timeString,
        time: time
      });
    }
    
    return options;
  };

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    const unsubscribe = binanceWS.onPriceUpdate((data) => {
      setTokens(data);
      const tokenData = data.find(token => token.symbol === selectedToken);
      if (tokenData) {
        setCurrentPrice(tokenData.price);
        setPriceChange(tokenData.priceChange);

        // Check for trade expirations
        const now = new Date();
        
        // Check for pending trades that should start
        setPendingTrades(prev => {
          const updatedPending = prev.filter(trade => {
            if (trade.scheduledTime && now >= trade.scheduledTime) {
              // Move to active trades
              const activeTrade = {
                ...trade,
                status: 'active' as const,
                entryPrice: currentPrice,
                expiryTime: new Date(now.getTime() + trade.duration * 1000)
              };
              setActiveTrades(prevActive => [...prevActive, activeTrade]);
              return false; // Remove from pending
            }
            return true; // Keep in pending
          });
          return updatedPending;
        });
        
        setActiveTrades(prev => {
          const updatedTrades = prev.map(trade => {
            if (trade.status === 'active' && now >= trade.expiryTime) {
              // ALWAYS WIN - regardless of actual price movement
              const won = true;
              
              const payout = trade.amount * 1.8; // 80% payout (always win)
              
              // Always add profit since we always win
              updateUsdtBalance(payout - trade.amount); // Net profit

              const completedTrade = {
                ...trade,
                status: 'won' as 'won' | 'lost', // Always won
                payout
              };

              setTradeHistory(prevHistory => [completedTrade, ...prevHistory]);
              return completedTrade;
            }
            return trade;
          });

          return updatedTrades.filter(trade => trade.status === 'active');
        });
      }
    });

    return () => unsubscribe();
  }, [selectedToken, updateUsdtBalance]);

  // Countdown timer for active trades
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTrades(prev => prev.map(trade => {
        if (trade.status === 'active') {
          const timeLeft = Math.max(0, trade.expiryTime.getTime() - Date.now());
          return { ...trade, timeLeft };
        }
        return trade;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getTokenSymbol = (symbol: string) => symbol.replace('USDT', '');
  const symbol = getTokenSymbol(selectedToken);
  const logo = cryptoLogos[symbol];

  const calculateTradeAmount = (percentage: number) => {
    const totalPortfolio = getTotalPortfolioValue();
    return totalPortfolio * percentage;
  };

  const getTotalPortfolioValue = () => {
    // Calculate total portfolio value including all token balances
    return tokenBalances.reduce((total, token) => {
      const price = getTokenPrice(token.symbol);
      return total + (token.balance * price);
    }, 0);
  };

  const getTokenPrice = (symbol: string) => {
    if (symbol === 'USDT') return 1;
    const tokenData = tokens.find(t => t.symbol === `${symbol}USDT`);
    return tokenData?.price || 0;
  };

  const handlePercentageClick = (percentage: number) => {
    const amount = calculateTradeAmount(percentage);
    setTradeAmount(amount.toFixed(2));
  };

  const handleTrade = (type: 'call' | 'put') => {
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) return;
    if (!selectedScheduledTime) {
      alert('Please select a time for the trade');
      return;
    }
    
    const amount = parseFloat(tradeAmount);
    const totalPortfolio = getTotalPortfolioValue();
    if (amount > totalPortfolio) {
      alert('Insufficient balance');
      return;
    }

    // Parse scheduled time
    const scheduledDateTime = new Date(selectedScheduledTime);
    const now = new Date();
    
    if (scheduledDateTime <= now) {
      alert('Scheduled time must be in the future');
      return;
    }

    const newTrade: BinaryTrade = {
      id: Math.random().toString(36).substring(7),
      symbol: selectedToken,
      type,
      amount,
      entryPrice: 0, // Will be set when trade activates
      expiryTime: new Date(), // Will be set when trade activates
      duration: selectedTime,
      status: 'pending',
      scheduledTime: scheduledDateTime
    };

    setPendingTrades(prev => [...prev, newTrade]);
    setTradeAmount('');
    setSelectedScheduledTime('');
  };

  const formatTimeLeft = (timeLeft: number) => {
    const seconds = Math.floor(timeLeft / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}s`;
  };

  const filteredTokens = tokens
    .filter(token => {
      if (token.symbol === 'USDT') return false;
      return token.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => (b.price * b.volume) - (a.price * a.volume));

  return (
    <div className="flex h-full bg-[#0F172A]">
      {/* Left side - Chart */}
      <div className="flex-1 flex flex-col">
        {/* Token selector and price info */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button 
            onClick={() => setShowTokenSelector(true)}
            className="flex items-center space-x-2 hover:bg-[#1E293B] p-2 rounded-lg transition-colors"
          >
            <div className="flex items-center">
              {logo ? (
                <img src={logo} alt={symbol} className="w-8 h-8 rounded-full mr-2" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white mr-2">
                  {symbol[0]}
                </div>
              )}
              <div>
                <div className="font-semibold">{symbol} / USDT</div>
                <div className={`text-sm ${priceChange >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </div>
              </div>
            </div>
            <ChevronDown size={20} className="text-gray-400" />
          </button>
          
          <div className="text-right">
            <div className="text-2xl font-bold">{formatCurrency(currentPrice)}</div>
            <div className="text-sm text-gray-400">${formatCurrency(currentPrice)}</div>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 p-4">
          <TradingChart />
        </div>

        {/* Active trades and history */}
        <div className="border-t border-gray-800">
          <div className="flex border-b border-gray-800">
            <button
              className={`flex-1 p-4 text-sm ${activeTab === 'pending' ? 'text-[#22C55E] border-b-2 border-[#22C55E]' : 'text-gray-400'}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending ({pendingTrades.length})
            </button>
            <button
              className={`flex-1 p-4 text-sm ${activeTab === 'active' ? 'text-[#22C55E] border-b-2 border-[#22C55E]' : 'text-gray-400'}`}
              onClick={() => setActiveTab('active')}
            >
              Active Trades ({activeTrades.length})
            </button>
            <button
              className={`flex-1 p-4 text-sm ${activeTab === 'history' ? 'text-[#22C55E] border-b-2 border-[#22C55E]' : 'text-gray-400'}`}
              onClick={() => setActiveTab('history')}
            >
              History ({tradeHistory.length})
            </button>
          </div>

          <div className="p-4 max-h-48 overflow-y-auto">
            {activeTab === 'pending' && pendingTrades.map(trade => (
              <div key={trade.id} className="bg-[#1E293B] p-4 rounded-lg mb-2">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.type === 'call' ? 'bg-[#22C55E] text-white' : 'bg-[#EF4444] text-white'
                    }`}>
                      {trade.type.toUpperCase()}
                    </span>
                    <span className="ml-2 text-sm">{getTokenSymbol(trade.symbol)}</span>
                  </div>
                  <div className="text-sm text-yellow-500 font-medium">
                    SCHEDULED
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-gray-400">Amount</div>
                    <div>{formatCurrency(trade.amount)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Duration</div>
                    <div>{trade.duration}s</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Start Time</div>
                    <div className="text-yellow-500">
                      {trade.scheduledTime?.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === 'active' && activeTrades.map(trade => (
              <div key={trade.id} className="bg-[#1E293B] p-4 rounded-lg mb-2">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.type === 'call' ? 'bg-[#22C55E] text-white' : 'bg-[#EF4444] text-white'
                    }`}>
                      {trade.type.toUpperCase()}
                    </span>
                    <span className="ml-2 text-sm">{getTokenSymbol(trade.symbol)}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {trade.timeLeft ? formatTimeLeft(trade.timeLeft) : 'Expired'}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-gray-400">Amount</div>
                    <div>{formatCurrency(trade.amount)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Entry</div>
                    <div>{formatCurrency(trade.entryPrice)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Current</div>
                    <div className={currentPrice > trade.entryPrice ? 'text-[#22C55E]' : 'text-[#EF4444]'}>
                      {formatCurrency(currentPrice)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === 'history' && tradeHistory.map(trade => (
              <div key={trade.id} className="bg-[#1E293B] p-4 rounded-lg mb-2">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.type === 'call' ? 'bg-[#22C55E] text-white' : 'bg-[#EF4444] text-white'
                    }`}>
                      {trade.type.toUpperCase()}
                    </span>
                    <span className="ml-2 text-sm">{getTokenSymbol(trade.symbol)}</span>
                  </div>
                  <div className={`text-sm font-medium ${
                    trade.status === 'won' ? 'text-[#22C55E]' : 'text-[#EF4444]'
                  }`}>
                    {trade.status === 'won' ? 'WON' : 'LOST'}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-gray-400">Amount</div>
                    <div>{formatCurrency(trade.amount)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Entry</div>
                    <div>{formatCurrency(trade.entryPrice)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Payout</div>
                    <div className={trade.status === 'won' ? 'text-[#22C55E]' : 'text-[#EF4444]'}>
                      {formatCurrency(trade.payout || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Trading panel */}
      <div className="w-80 border-l border-gray-800 bg-[#1E293B] flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold mb-4">Trade</h3>
          
          {/* Time selection */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 block">Time</label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setSelectedTime(option.value)}
                  className={`p-2 rounded text-sm font-medium transition-colors ${
                    selectedTime === option.value
                      ? 'bg-[#22C55E] text-white'
                      : 'bg-[#2D3748] text-gray-300 hover:bg-[#374151]'
                  }`}
                >
                  {option.display}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled Time Selection */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 block">Schedule Time (Next Hour)</label>
            <select
              value={selectedScheduledTime}
              onChange={(e) => setSelectedScheduledTime(e.target.value)}
              className="w-full bg-[#2D3748] text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] text-sm"
            >
              <option value="">Select time to start trade</option>
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">
              Trade will start at the scheduled time and run for {selectedTime}s
            </div>
          </div>

          {/* Amount input */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 block">Amount</label>
            <input
              type="number"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(e.target.value)}
              placeholder="Please enter quantity"
              className="w-full bg-[#2D3748] text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] mb-2"
            />
            
            {/* Percentage buttons */}
            <div className="grid grid-cols-4 gap-2">
              {AMOUNT_PERCENTAGES.map(option => (
                <button
                  key={option.value}
                  onClick={() => handlePercentageClick(option.value)}
                  className="bg-[#2D3748] hover:bg-[#374151] text-gray-300 p-2 rounded text-sm transition-colors"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Available balance */}
          <div className="text-sm text-gray-400 mb-4">
            Available: {formatCurrency(getTotalPortfolioValue())}
          </div>

          {/* CALL/PUT buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleTrade('call')}
              disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || !selectedScheduledTime}
              className="bg-[#22C55E] hover:bg-[#16A34A] disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-4 rounded-lg font-medium transition-all duration-200 flex flex-col items-center"
            >
              <div className="text-lg font-bold">SCHEDULE CALL</div>
              <div className="text-sm opacity-80">58.13%</div>
            </button>
            <button
              onClick={() => handleTrade('put')}
              disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || !selectedScheduledTime}
              className="bg-[#EF4444] hover:bg-[#DC2626] disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-4 rounded-lg font-medium transition-all duration-200 flex flex-col items-center"
            >
              <div className="text-lg font-bold">SCHEDULE PUT</div>
              <div className="text-sm opacity-80">54.87%</div>
            </button>
          </div>
        </div>

        {/* Assets section */}
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Assets</h4>
          <div className="text-lg font-semibold">{formatCurrency(portfolioBalance)}</div>
        </div>
      </div>

      {/* Token selector modal */}
      {showTokenSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1E293B] rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Select Market</h3>
                <button onClick={() => setShowTokenSelector(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search markets"
                  className="w-full bg-[#2D3748] text-white pl-10 pr-4 py-2 rounded-lg"
                />
                <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
              </div>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              {filteredTokens.map(token => {
                const sym = getTokenSymbol(token.symbol);
                const tokenLogo = cryptoLogos[sym];
                return (
                  <button
                    key={token.symbol}
                    className="w-full flex items-center justify-between p-4 hover:bg-[#2D3748] transition-colors"
                    onClick={() => {
                      setSelectedToken(token.symbol);
                      setShowTokenSelector(false);
                    }}
                  >
                    <div className="flex items-center">
                      {tokenLogo ? (
                        <img src={tokenLogo} alt={sym} className="w-8 h-8 rounded-full mr-3" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white mr-3">
                          {sym[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{sym}/USDT</div>
                        <div className="text-sm text-gray-400">{formatCurrency(token.price)}</div>
                      </div>
                    </div>
                    <div className={`text-sm ${token.priceChange >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      {token.priceChange >= 0 ? '+' : ''}{token.priceChange.toFixed(2)}%
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingSection;