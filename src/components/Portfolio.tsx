import React, { useState, useEffect } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight } from 'lucide-react';
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

  const actions = [
    { 
      icon: ArrowDownToLine, 
      label: 'Deposit', 
      color: 'text-[#22C55E]', 
      onClick: () => setShowDepositModal(true) 
    },
    { 
      icon: ArrowUpFromLine, 
      label: 'Withdraw', 
      color: 'text-[#EF4444]', 
      onClick: () => setShowWithdrawModal(true) 
    },
    { 
      icon: ArrowLeftRight, 
      label: 'Convert', 
      color: 'text-[#3B82F6]', 
      onClick: () => setShowConvertModal(true) 
    }
  ];

  return (
    <>
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-sm text-gray-400">Total Assets Value</div>
              <div className="text-2xl font-semibold">{formatCurrency(getTotalAssetsValue())}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Today's PNL</div>
              <div className={`text-lg font-semibold ${todayPnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {todayPnl >= 0 ? '+' : ''}{formatCurrency(todayPnl)}
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {actions.map(({ icon: Icon, label, color, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="bg-[#2D3748] hover:bg-[#374151] rounded-lg p-4 transition-colors flex flex-col items-center justify-center"
              >
                <Icon className={`w-6 h-6 ${color} mb-2`} />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {tokenBalances.map(token => {
              const logo = cryptoLogos[token.symbol];
              const price = getTokenPrice(token.symbol);
              const usdValue = token.balance * price;
              
              return (
                <div key={token.symbol} className="bg-gray-750 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {logo ? (
                        <img 
                          src={logo} 
                          alt={token.symbol} 
                          className="w-8 h-8 rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white mr-3">
                          {token.symbol.substring(0, 1)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-sm text-gray-400">
                          {token.balance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div>
                        {formatCurrency(usdValue)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatCurrency(price)}
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