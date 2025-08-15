import React, { useState, useEffect } from 'react';
import { Info, Clock, Wallet, ChevronDown, Eye, EyeOff, X, Minus, Plus, Search, TrendingUp as CallIcon, TrendingDown as PutIcon } from 'lucide-react';
import { binanceWS } from '../services/binanceWebSocket';
import { formatCurrency } from '../utils/formatters';
import { useToken } from '../context/TokenContext';
import { usePositions } from '../context/PositionContext';
import { cryptoLogos } from '../utils/cryptoLogos';
import TradingChart from './TradingChart';
import OrderBook from './OrderBook';
import TokenList from './TokenList';

const TIME_PERIODS = [
  { label: '60s', value: 60, seconds: 60 },
  { label: '120s', value: 120, seconds: 120 },
  { label: '5min', value: 300, seconds: 300 },
  { label: '10min', value: 600, seconds: 600 }
];

const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 25, 50, 75, 100, 125];

interface LimitOrder {
  id: string;
  symbol: string;
  type: 'long' | 'short';
  amount: number;
  limitPrice: number;
  leverage: number;
}

const TradingSection: React.FC = () => {
  const { selectedToken, setSelectedToken } = useToken();
  const { openPosition, positions, portfolioBalance, closePosition, updateUsdtBalance } = usePositions();
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [positionType, setPositionType] = useState<'long' | 'short'>('long');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [leverage, setLeverage] = useState(20);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(TIME_PERIODS[0]);
  const [countdown, setCountdown] = useState(0);
  const [orderDeadline, setOrderDeadline] = useState<Date | null>(null);
  const [callPercentage, setCallPercentage] = useState(55.56);
  const [putPercentage, setPutPercentage] = useState(44.44);
  const [showLeverageModal, setShowLeverageModal] = useState(false);
  const [showOrderBook, setShowOrderBook] = useState(true);
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tokens, setTokens] = useState<any[]>([]);
  const [limitOrders, setLimitOrders] = useState<LimitOrder[]>([]);

  const openPositions = positions.filter(pos => pos.status === 'open');
  const closedPositions = positions.filter(pos => pos.status === 'closed');

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Start new period
            const newDeadline = new Date();
            newDeadline.setSeconds(newDeadline.getSeconds() + selectedTimePeriod.seconds);
            setOrderDeadline(newDeadline);
            return selectedTimePeriod.seconds;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Initialize countdown
      const newDeadline = new Date();
      newDeadline.setSeconds(newDeadline.getSeconds() + selectedTimePeriod.seconds);
      setOrderDeadline(newDeadline);
      setCountdown(selectedTimePeriod.seconds);
    }

    return () => clearInterval(interval);
  }, [selectedTimePeriod, countdown]);

  // Update call/put percentages randomly
  useEffect(() => {
    const interval = setInterval(() => {
      const newCall = 45 + Math.random() * 20; // 45-65%
      setCallPercentage(newCall);
      setPutPercentage(100 - newCall);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = binanceWS.onPriceUpdate((data) => {
      setTokens(data);
      const tokenData = data.find(token => token.symbol === selectedToken);
      if (tokenData) {
        setCurrentPrice(tokenData.price);
        setPriceChange(tokenData.priceChange);

        limitOrders.forEach(order => {
          const shouldExecute = order.type === 'long' 
            ? tokenData.price <= order.limitPrice
            : tokenData.price >= order.limitPrice;

          if (shouldExecute) {
            openPosition({
              symbol: order.symbol,
              type: order.type,
              entryPrice: order.limitPrice,
              amount: order.amount,
              leverage: order.leverage
            });
            
            setLimitOrders(prev => prev.filter(o => o.id !== order.id));
          }
        });

        positions.forEach(position => {
          if (position.status === 'open') {
            const priceDiff = position.type === 'long'
              ? tokenData.price - position.entryPrice
              : position.entryPrice - tokenData.price;

            const pnl = priceDiff * position.amount * position.leverage;

            if (Math.abs(pnl) >= portfolioBalance) {
              closePosition(position.id);
            }
          }
        });
      }
    });

    return () => unsubscribe();
  }, [selectedToken, positions, portfolioBalance, closePosition, limitOrders]);

  const getTokenSymbol = (symbol: string) => symbol.replace('USDT', '');
  const symbol = getTokenSymbol(selectedToken);
  const logo = cryptoLogos[symbol];

  const formatTime = (seconds: number) => {
    return `${seconds}s`;
  };

  const formatDeadline = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/(\d+)\/(\d+)\/(\d+),/, '$3/$1/$2');
  };

  const getTimePeriodDisplay = () => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(orderDeadline || now);
    
    return `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}-${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
  };

  const calculateValue = () => {
    if (!quantity) return 0;
    return parseFloat(quantity) * currentPrice;
  };

  const calculateMaxQuantity = () => {
    return (portfolioBalance * leverage) / currentPrice;
  };

  const handleSetMaxQuantity = () => {
    setQuantity(calculateMaxQuantity().toFixed(8));
  };

  const handleLeverageChange = (newLeverage: number) => {
    setLeverage(newLeverage);
    setShowLeverageModal(false);
  };

  const handleOpenPosition = () => {
    if (!quantity || parseFloat(quantity) <= 0) return;
    
    if (portfolioBalance <= 0) {
      alert('Insufficient balance to open position');
      return;
    }

    try {
      if (orderType === 'market') {
        openPosition({
          symbol: selectedToken,
          type: positionType,
          entryPrice: currentPrice,
          amount: parseFloat(quantity),
          leverage
        });
      } else if (orderType === 'limit' && limitPrice) {
        const order: LimitOrder = {
          id: Math.random().toString(36).substring(7),
          symbol: selectedToken,
          type: positionType,
          amount: parseFloat(quantity),
          limitPrice: parseFloat(limitPrice),
          leverage
        };
        
        setLimitOrders(prev => [...prev, order]);
      }

      setQuantity('');
      setLimitPrice('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to open position');
    }
  };

  const cancelLimitOrder = (orderId: string) => {
    setLimitOrders(prev => prev.filter(order => order.id !== orderId));
  };

  const filteredTokens = tokens
    .filter(token => {
      if (token.symbol === 'USDT') return false;
      return token.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => (b.price * b.volume) - (a.price * a.volume));

  return (
    <div className="flex flex-col h-full bg-[#0F172A]">
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
              <div className="font-semibold">{symbol}</div>
              <div className={`text-sm ${priceChange >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </div>
            </div>
          </div>
          <ChevronDown size={20} className="text-gray-400" />
        </button>
        <div className="flex items-center space-x-4">
          <div className={`text-lg ${currentPrice >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
            {formatCurrency(currentPrice)}
          </div>
          <button onClick={() => setShowOrderBook(!showOrderBook)}>
            {showOrderBook ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Time Period Selection */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex space-x-2 mb-4">
          {TIME_PERIODS.map((period) => (
            <button
              key={period.value}
              onClick={() => {
                setSelectedTimePeriod(period);
                setCountdown(0); // Reset countdown to trigger new period
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTimePeriod.value === period.value
                  ? 'bg-[#4A5568] text-white'
                  : 'bg-[#2D3748] text-gray-400 hover:bg-[#374151]'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-400 mb-1">Order deadline(UTC+3)</div>
            <div className="text-white">{formatDeadline(orderDeadline)}</div>
          </div>
          <div className="text-center">
            <div className="text-[#22C55E] mb-1">Countdown</div>
            <div className="text-[#22C55E] text-lg font-bold">{formatTime(countdown)}</div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 mb-1">Time Period</div>
            <div className="text-white">{getTimePeriodDisplay()}</div>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="px-4 py-2 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-1 text-gray-400">
            <span>Line</span>
            <ChevronDown size={16} />
          </button>
          <button className="flex items-center space-x-1 text-gray-400">
            <span>VOL</span>
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

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

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          {/* Chart Area */}
          <div className="flex-1 p-4">
            <TradingChart />
          </div>
        </div>
      </div>

      {/* Bottom Section with Tabs and Call/Put Buttons */}
      <div className="border-t border-gray-800">
        <div className="flex border-b border-gray-800">
          <button
            className={`flex-1 p-4 text-sm ${activeTab === 'positions' ? 'text-[#22C55E] border-b-2 border-[#22C55E]' : 'text-gray-400'}`}
            onClick={() => setActiveTab('positions')}
          >
            Position order
          </button>
          <button
            className={`flex-1 p-4 text-sm ${activeTab === 'orders' ? 'text-[#22C55E] border-b-2 border-[#22C55E]' : 'text-gray-400'}`}
            onClick={() => setActiveTab('orders')}
          >
            Historical orders
          </button>
          <button
            className={`flex-1 p-4 text-sm ${activeTab === 'history' ? 'text-[#22C55E] border-b-2 border-[#22C55E]' : 'text-gray-400'}`}
            onClick={() => setActiveTab('history')}
          >
            Invited me
          </button>
          <button className="flex-1 p-4 text-sm text-gray-400">
            Follow
          </button>
        </div>

        {/* Call/Put Buttons */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setPositionType('long');
                handleOpenPosition();
              }}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white p-4 rounded-lg font-medium transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <CallIcon size={20} className="mr-2" />
                <span>CALL</span>
              </div>
              <span className="text-lg font-bold">{callPercentage.toFixed(2)}%</span>
            </button>
            <button
              onClick={() => {
                setPositionType('short');
                handleOpenPosition();
              }}
              className="bg-[#EF4444] hover:bg-[#DC2626] text-white p-4 rounded-lg font-medium transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <PutIcon size={20} className="mr-2" />
                <span>PUT</span>
              </div>
              <span className="text-lg font-bold">{putPercentage.toFixed(2)}%</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 max-h-48 overflow-y-auto">
          {activeTab === 'positions' && openPositions.map(position => (
            <div key={position.id} className="bg-[#1E293B] p-4 rounded-lg mb-2">
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <span className={`text-sm ${position.type === 'long' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {position.type.toUpperCase()}
                  </span>
                  <span className="ml-2">{position.leverage}x</span>
                </div>
                <button
                  onClick={() => closePosition(position.id)}
                  className="text-sm text-gray-400"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">Size</div>
                <div className="text-right">{position.amount} {getTokenSymbol(position.symbol)}</div>
                <div className="text-gray-400">Entry Price</div>
                <div className="text-right">{formatCurrency(position.entryPrice)}</div>
                <div className="text-gray-400">Mark Price</div>
                <div className="text-right">{formatCurrency(currentPrice)}</div>
                <div className="text-gray-400">PNL</div>
                <div className={`text-right ${position.pnl && position.pnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {formatCurrency(position.pnl || 0)} ({position.pnlPercent?.toFixed(2)}%)
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'orders' && limitOrders.map(order => (
            <div key={order.id} className="bg-[#1E293B] p-4 rounded-lg mb-2">
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <span className={`text-sm ${order.type === 'long' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {order.type.toUpperCase()}
                  </span>
                  <span className="ml-2">{order.leverage}x</span>
                </div>
                <button
                  onClick={() => cancelLimitOrder(order.id)}
                  className="text-sm text-gray-400"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">Symbol</div>
                <div className="text-right">{getTokenSymbol(order.symbol)}/USDT</div>
                <div className="text-gray-400">Amount</div>
                <div className="text-right">{order.amount}</div>
                <div className="text-gray-400">Limit Price</div>
                <div className="text-right">{formatCurrency(order.limitPrice)}</div>
                <div className="text-gray-400">Current Price</div>
                <div className="text-right">{formatCurrency(currentPrice)}</div>
              </div>
            </div>
          ))}

          {activeTab === 'history' && closedPositions.map(position => (
            <div key={position.id} className="bg-[#1E293B] p-4 rounded-lg mb-2">
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <span className={`text-sm ${position.type === 'long' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {position.type.toUpperCase()}
                  </span>
                  <span className="ml-2">{position.leverage}x</span>
                </div>
                <span className="text-sm text-gray-400">
                  {position.closeTime?.toLocaleTimeString()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">Entry Price</div>
                <div className="text-right">{formatCurrency(position.entryPrice)}</div>
                <div className="text-gray-400">Close Price</div>
                <div className="text-right">{formatCurrency(currentPrice)}</div>
                <div className="text-gray-400">PNL</div>
                <div className={`text-right ${position.pnl && position.pnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {formatCurrency(position.pnl || 0)} ({position.pnlPercent?.toFixed(2)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {showLeverageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1E293B] rounded-lg w-full max-w-md p-4 m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Adjust Leverage</h3>
              <button onClick={() => setShowLeverageModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setLeverage(Math.max(1, leverage - 1))}
                className="p-2 bg-[#2D3748] rounded-lg"
              >
                <Minus size={20} />
              </button>
              <span className="text-2xl font-bold">{leverage}x</span>
              <button
                onClick={() => setLeverage(Math.min(125, leverage + 1))}
                className="p-2 bg-[#2D3748] rounded-lg"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 mb-4">
              {LEVERAGE_OPTIONS.map(value => (
                <button
                  key={value}
                  onClick={() => handleLeverageChange(value)}
                  className={`p-2 rounded-lg text-center ${
                    leverage === value
                      ? 'bg-[#22C55E] text-white'
                      : 'bg-[#2D3748] hover:bg-[#374151]'
                  }`}
                >
                  {value}x
                </button>
              ))}
            </div>

            <div className="text-sm text-gray-400">
              Higher leverage means higher risk of liquidation
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingSection;