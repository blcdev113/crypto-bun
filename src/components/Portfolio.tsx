import React, { useState, useEffect } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, ArrowRightLeft } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { usePositions } from '../context/PositionContext';
import { cryptoLogos } from '../utils/cryptoLogos';
import { binanceWS } from '../services/binanceWebSocket';
import ConvertModal from './ConvertModal';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import TransferModal from './TransferModal';

const Portfolio: React.FC = () => {
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [prices, setPrices] = useState<any[]>([]);
  const [activeAccount, setActiveAccount] = useState<'trading' | 'funding'>('trading');
  const { tokenBalances, tradingBalances, fundingBalances, positions, transferBetweenAccounts } = usePositions();
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

  const getTotalAssetsValue = (balances: typeof tokenBalances) => {
    return balances.reduce((total, token) => {
      const price = getTokenPrice(token.symbol);
      return total + (token.balance * price);
    }, 0);
  };

  const currentBalances = activeAccount === 'trading' ? tradingBalances : fundingBalances;

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
      icon: ArrowRightLeft, 
      label: 'Transfer', 
      color: 'text-[#3B82F6]', 
      onClick: () => setShowTransferModal(true) 
    },
    { 
      icon: ArrowLeftRight, 
      label: 'Convert', 
      color: 'text-[#F59E0B]', 
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
              <div className="text-2xl font-semibold">
                {formatCurrency(getTotalAssetsValue(tradingBalances) + getTotalAssetsValue(fundingBalances))}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Today's PNL</div>
              <div className={`text-lg font-semibold ${todayPnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {todayPnl >= 0 ? '+' : ''}{formatCurrency(todayPnl)}
              </div>
            </div>
          </div>
          
          {/* Account Tabs */}
          <div className="flex space-x-1 mb-4 bg-[#2D3748] rounded-lg p-1">
            <button
              onClick={() => setActiveAccount('trading')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeAccount === 'trading'
                  ? 'bg-[#22C55E] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Trading Account
            </button>
            <button
              onClick={() => setActiveAccount('funding')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeAccount === 'funding'
                  ? 'bg-[#22C55E] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Funding Account
            </button>
          </div>

          {/* Account Balance */}
          <div className="mb-4 p-3 bg-[#2D3748] rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-400">
                  {activeAccount === 'trading' ? 'Trading' : 'Funding'} Account Balance
                </div>
                <div className="text-xl font-semibold">
                  {formatCurrency(getTotalAssetsValue(currentBalances))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Available Assets</div>
                <div className="text-lg">
                  {currentBalances.filter(token => token.balance > 0).length} tokens
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {actions.map(({ icon: Icon, label, color, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="bg-[#2D3748] hover:bg-[#374151] rounded-lg p-3 transition-colors flex flex-col items-center justify-center"
              >
                <Icon className={`w-5 h-5 ${color} mb-1`} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* Token List */}
          <div className="space-y-3">
            {currentBalances
              .filter(token => token.balance > 0)
              .map(token => {
                const logo = cryptoLogos[token.symbol];
                const price = getTokenPrice(token.symbol);
                const usdValue = token.balance * price;
                
                return (
                  <div key={token.symbol} className="bg-[#374151] rounded-md p-3">
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
            
            {currentBalances.filter(token => token.balance > 0).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <div className="text-lg mb-2">No assets in {activeAccount} account</div>
                <div className="text-sm">
                  {activeAccount === 'funding' 
                    ? 'Transfer funds from trading account or make a deposit'
                    : 'Make a deposit or transfer funds from funding account'
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConvertModal 
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        prices={prices}
        tokenBalances={currentBalances}
      />

      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
      />

      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        tradingBalances={tradingBalances}
        fundingBalances={fundingBalances}
        onTransfer={transferBetweenAccounts}
      />
    </>
  );
};

export default Portfolio;