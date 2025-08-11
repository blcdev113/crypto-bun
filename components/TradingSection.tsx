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

const TIME_OPTIONS = ['10:00', '10:30', '15:00', '15:30', '18:00', '18:30', '18:45', '19:00', '19:30', '19:45', '20:45', '21:00'];
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
  const [showLeverageModal, setShowLeverageModal] = useState(false);
  const [showOrderBook, setShowOrderBook] = useState(true);
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tokens, setTokens] = useState<any[]>([]);
  const [limitOrders, setLimitOrders] = useState<LimitOrder[]>([]);

  const openPositions = positions.filter(pos => pos.status === 'open');
  const closedPositions = positions.filter(pos => pos.status === 'closed');

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
          <div className="p-4 bg-[#1E293B]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Available</span>
              <span>{formatCurrency(portfolioBalance)}</span>
            </div>

            <button
              onClick={() => setShowLeverageModal(true)}
              className="w-full bg-[#2D3748] p-2 rounded flex items-center justify-between"
            >
              <span>Cross {leverage}x</span>
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="p-4 flex-1">
            <div className="flex mb-4">
              <button
                className={`flex-1 py-2 ${orderType === 'market' ? 'text-white border-b-2 border-[#22C55E]' : 'text-gray-400'}`}
                onClick={() => setOrderType('market')}
              >
                Market
              </button>
              <button
                className={`flex-1 py-2 ${orderType === 'limit' ? 'text-white border-b-2 border-[#22C55E]' : 'text-gray-400'}`}
                onClick={() => setOrderType('limit')}
              >
                Limit
              </button>
            </div>

            {orderType === 'limit' && (
              <div className="mb-4">
                <input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder="Limit Price"
                  className="w-full bg-[#2D3748] p-3 rounded"
                />
              </div>
            )}

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Quantity ({symbol})</span>
                <span className="text-gray-400">Max: {calculateMaxQuantity().toFixed(8)}</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#2D3748] p-3 rounded pr-16"
                />
                <button
                  onClick={handleSetMaxQuantity}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#22C55E] text-sm"
                >
                  MAX
                </button>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Value: {formatCurrency(calculateValue())}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setPositionType('long');
                  handleOpenPosition();
                }}
                disabled={!quantity || parseFloat(quantity) <= 0}
                className="bg-[#22C55E] text-white p-3 rounded font-medium disabled:opacity-50"
              >
                Long
              </button>
              <button
                onClick={() => {
                  setPositionType('short');
                  handleOpenPosition();
                }}
                disabled={!quantity || parseFloat(quantity) <= 0}
                className="bg-[#EF4444] text-white p-3 rounded font-medium disabled:opacity-50"
              >
                Short
              </button>
            </div>
          </div>

          <div className="border-t border-gray-800">
            <div className="flex border-b border-gray-800">
              <button
                className={`flex-1 p-4 text-sm ${activeTab === 'positions' ? 'text-[#22C55E] border-b-2 border-[#22C55E]' : 'text-gray-400'}`}
                onClick={() => setActiveTab('positions')}
              >
                Positions ({openPositions.length})
              </button>
              <button
                className={`flex-1 p-4 text-sm ${activeTab === 'orders' ? 'text-[#22C55E] border-b-2 border-[#22C55E]' : 'text-gray-400'}`}
                onClick={() => setActiveTab('orders')}
              >
                Orders ({limitOrders.length})
              </button>
              <button
                className={`flex-1 p-4 text-sm ${activeTab === 'history' ? 'text-[#22C55E] border-b-2 border-[#22C55E]' : 'text-gray-400'}`}
                onClick={() => setActiveTab('history')}
              >
                History
              </button>
            </div>

            <div className="p-4">
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
        </div>

        {showOrderBook && (
          <div className="w-[300px] border-l border-gray-800">
            <OrderBook />
          </div>
        )}
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