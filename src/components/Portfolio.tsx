import React, { useState, useEffect } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Send } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { usePositions } from '../context/PositionContext';
import { cryptoLogos } from '../utils/cryptoLogos';
import { binanceWS } from '../services/binanceWebSocket';
import ConvertModal from './ConvertModal';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';

const Portfolio: React.FC = () => {
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [prices, setPrices] = useState<any[]>([]);
  const { tokenBalances, positions } = usePositions();
  const [todayPnl, setTodayPnl] = useState(0);
  
  useEffect(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const unsubscribe = binanceWS.onPriceUpdate((data) => {
      setPrices(data);
      
      // Calculate today's PNL from positions
      const todaysPnl = positions.reduce((total, position) => {
        // Only include positions that were opened or closed today
        const openedToday = position.openTime >= startOfDay;
        const closedToday = position.closeTime && position.closeTime >= startOfDay;
        
        if (openedToday || closedToday) {
          return total + (position.pnl || 0);
        }
        return total;
      }, 0);

      setTodayPnl(todaysPnl);
    });
    return () => unsubscribe();
  }, [positions]);

  const getTokenPrice = (symbol: string) => {
    if (symbol === 'USDT') return 1;
    const price = prices.find(p => p.symbol === `${symbol}USDT`)?.price || 0;
    return price;
  };

  const getTotalAssetsValue = () => {
    return tokenBalances.reduce((total, token) => {
      const price = getTokenPrice(token.symbol);
      return total + (token.balance * price);
    }, 0);
  };

  // Mock account breakdown - in real app this would come from backend
  const getAccountBreakdown = () => {
    const totalAssets = getTotalAssetsValue();
    return {
      exchange: totalAssets * 0.6, // 60% in exchange account
      perpetual: totalAssets * 0.3, // 30% in perpetual account  
      trade: totalAssets * 0.1 // 10% in trade account
    };
  };

  const accountBreakdown = getAccountBreakdown();

  const actions = [
    { 
      icon: ArrowUpFromLine, 
      label: 'Withdraw', 
      color: 'text-[#EF4444]', 
      bgColor: 'bg-[#EF4444]',
      onClick: () => setShowWithdrawModal(true) 
    },
    { 
      icon: ArrowDownToLine, 
      label: 'Deposit', 
      color: 'text-[#22C55E]', 
      bgColor: 'bg-[#22C55E]',
      onClick: () => setShowDepositModal(true) 
    },
    { 
      icon: Send, 
      label: 'Transfer', 
      color: 'text-[#F59E0B]', 
      bgColor: 'bg-[#F59E0B]',
      onClick: () => {} // Placeholder for transfer functionality
    },
    { 
      icon: ArrowLeftRight, 
      label: 'Convert', 
      color: 'text-[#3B82F6]', 
      bgColor: 'bg-[#3B82F6]',
      onClick: () => setShowConvertModal(true) 
    }
  ];

  return (
    <>
      <div className="p-2 md:p-4 space-y-4 md:space-y-6">
        {/* Total Assets Overview */}
        <div className="bg-[#1E293B] rounded-lg p-4 md:p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-xs md:text-sm text-gray-400 mb-1">Total Assets Value</div>
              <div className="text-xl md:text-3xl font-bold">{formatCurrency(getTotalAssetsValue())}</div>
            </div>
            <div className="text-right">
              <div className="text-xs md:text-sm text-gray-400 mb-1">Today's PNL</div>
              <div className={`text-lg md:text-xl font-semibold ${todayPnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {todayPnl >= 0 ? '+' : ''}{formatCurrency(todayPnl)}
                <span className="text-xs md:text-sm ml-1">
                  ({todayPnl >= 0 ? '+' : ''}{((todayPnl / getTotalAssetsValue()) * 100).toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            {actions.map(({ icon: Icon, label, color, bgColor, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="bg-[#2D3748] hover:bg-[#374151] rounded-lg p-3 md:p-4 transition-colors flex flex-col items-center justify-center group"
              >
                <div className={`w-8 h-8 md:w-12 md:h-12 ${bgColor} bg-opacity-10 rounded-full flex items-center justify-center mb-2 md:mb-3 group-hover:bg-opacity-20 transition-colors`}>
                  <Icon className={`w-4 h-4 md:w-6 md:h-6 ${color}`} />
                </div>
                <span className="text-xs md:text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Account Type Selector */}
        <div className="bg-[#1E293B] rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-semibold">Real Account</h3>
            <div className="bg-[#22C55E] bg-opacity-10 text-[#22C55E] px-2 md:px-3 py-1 rounded-full text-xs md:text-sm">
              Active
            </div>
          </div>
          
          {/* Account Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 mb-4">
            <div className="bg-[#2D3748] rounded-lg p-3 md:p-4 text-center">
              <div className="text-xs md:text-sm text-gray-400 mb-1">Exchange</div>
              <div className="text-base md:text-lg font-semibold">{formatCurrency(accountBreakdown.exchange)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {((accountBreakdown.exchange / getTotalAssetsValue()) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-[#2D3748] rounded-lg p-3 md:p-4 text-center">
              <div className="text-xs md:text-sm text-gray-400 mb-1">Perpetual</div>
              <div className="text-base md:text-lg font-semibold">{formatCurrency(accountBreakdown.perpetual)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {((accountBreakdown.perpetual / getTotalAssetsValue()) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-[#2D3748] rounded-lg p-3 md:p-4 text-center">
              <div className="text-xs md:text-sm text-gray-400 mb-1">Trade</div>
              <div className="text-base md:text-lg font-semibold">{formatCurrency(accountBreakdown.trade)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {((accountBreakdown.trade / getTotalAssetsValue()) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Token Holdings */}
        <div className="bg-[#1E293B] rounded-lg overflow-hidden">
          <div className="p-3 md:p-4 border-b border-gray-700">
            <h3 className="text-base md:text-lg font-semibold">Holdings</h3>
          </div>
          
          <div className="divide-y divide-gray-700">
            {tokenBalances
              .filter(token => token.balance > 0)
              .map(token => {
                const logo = cryptoLogos[token.symbol];
                const price = getTokenPrice(token.symbol);
                const usdValue = token.balance * price;
                const percentage = (usdValue / getTotalAssetsValue()) * 100;
                
                return (
                  <div key={token.symbol} className="p-3 md:p-4 hover:bg-[#2D3748] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {logo ? (
                          <img 
                            src={logo} 
                            alt={token.symbol} 
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full mr-3 md:mr-4"
                          />
                        ) : (
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#22C55E] flex items-center justify-center text-white mr-3 md:mr-4 text-sm">
                            {token.symbol.substring(0, 1)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-base md:text-lg">{token.symbol}</div>
                          <div className="text-xs md:text-sm text-gray-400">
                            {token.symbol === 'USDT' ? 'Tether USD' : token.symbol}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-base md:text-lg">
                          {formatCurrency(usdValue)}
                        </div>
                        <div className="text-xs md:text-sm text-gray-400">
                          {token.balance.toLocaleString()} {token.symbol}
                        </div>
                        <div className="text-xs text-gray-500">
                          {percentage.toFixed(2)}% of portfolio
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <ConvertModal 
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        prices={prices}
        tokenBalances={tokenBalances}
      />

      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
      />
    </>
  );
};

export default Portfolio;