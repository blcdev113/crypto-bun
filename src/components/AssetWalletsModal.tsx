import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, ArrowUpDown, Plus, Minus } from 'lucide-react';
import { usePositions } from '../context/PositionContext';
import { cryptoLogos } from '../utils/cryptoLogos';
import { formatCurrency } from '../utils/formatters';
import { binanceWS } from '../services/binanceWebSocket';

interface AssetWalletsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AssetWalletsModal: React.FC<AssetWalletsModalProps> = ({ isOpen, onClose }) => {
  const { tradingBalances, fundingBalances, transferBetweenAccounts } = usePositions();
  const [showBalances, setShowBalances] = useState(true);
  const [prices, setPrices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'trading' | 'funding'>('overview');

  useEffect(() => {
    const unsubscribe = binanceWS.onPriceUpdate((data) => {
      setPrices(data);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const getTokenPrice = (symbol: string) => {
    if (symbol === 'USDT') return 1;
    const price = prices.find(p => p.symbol === `${symbol}USDT`)?.price || 0;
    return price;
  };

  const getTotalValue = (balances: typeof tradingBalances) => {
    return balances.reduce((total, token) => {
      const price = getTokenPrice(token.symbol);
      return total + (token.balance * price);
    }, 0);
  };

  const getAllTokens = () => {
    const tokenMap = new Map();
    
    // Combine trading and funding balances
    [...tradingBalances, ...fundingBalances].forEach(token => {
      if (tokenMap.has(token.symbol)) {
        tokenMap.set(token.symbol, {
          ...tokenMap.get(token.symbol),
          totalBalance: tokenMap.get(token.symbol).totalBalance + token.balance
        });
      } else {
        const tradingBalance = tradingBalances.find(t => t.symbol === token.symbol)?.balance || 0;
        const fundingBalance = fundingBalances.find(t => t.symbol === token.symbol)?.balance || 0;
        
        tokenMap.set(token.symbol, {
          symbol: token.symbol,
          tradingBalance,
          fundingBalance,
          totalBalance: tradingBalance + fundingBalance
        });
      }
    });

    return Array.from(tokenMap.values()).filter(token => token.totalBalance > 0);
  };

  const renderTokenRow = (token: any, showAccountBreakdown = false) => {
    const logo = cryptoLogos[token.symbol];
    const price = getTokenPrice(token.symbol);
    const totalValue = token.totalBalance * price;

    return (
      <div key={token.symbol} className="bg-[#2D3748] rounded-lg p-4 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {logo ? (
              <img src={logo} alt={token.symbol} className="w-10 h-10 rounded-full mr-3" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#22C55E] flex items-center justify-center text-white mr-3">
                {token.symbol[0]}
              </div>
            )}
            <div>
              <div className="font-semibold text-lg">{token.symbol}</div>
              <div className="text-sm text-gray-400">
                {formatCurrency(price)} per {token.symbol}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-lg">
              {showBalances ? token.totalBalance.toFixed(8) : '****'}
            </div>
            <div className="text-sm text-gray-400">
              ≈ {showBalances ? formatCurrency(totalValue) : '****'}
            </div>
          </div>
        </div>

        {showAccountBreakdown && (
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#374151] rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Trading Account</div>
                <div className="font-medium">
                  {showBalances ? token.tradingBalance.toFixed(8) : '****'} {token.symbol}
                </div>
                <div className="text-xs text-gray-400">
                  ≈ {showBalances ? formatCurrency(token.tradingBalance * price) : '****'}
                </div>
              </div>
              <div className="bg-[#374151] rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Funding Account</div>
                <div className="font-medium">
                  {showBalances ? token.fundingBalance.toFixed(8) : '****'} {token.symbol}
                </div>
                <div className="text-xs text-gray-400">
                  ≈ {showBalances ? formatCurrency(token.fundingBalance * price) : '****'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAccountTokens = (balances: typeof tradingBalances, accountName: string) => {
    const tokensWithBalance = balances.filter(token => token.balance > 0);
    
    if (tokensWithBalance.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          <div className="text-lg mb-2">No assets in {accountName}</div>
          <div className="text-sm">Transfer funds or make a deposit to get started</div>
        </div>
      );
    }

    return tokensWithBalance.map(token => {
      const logo = cryptoLogos[token.symbol];
      const price = getTokenPrice(token.symbol);
      const totalValue = token.balance * price;

      return (
        <div key={token.symbol} className="bg-[#2D3748] rounded-lg p-4 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {logo ? (
                <img src={logo} alt={token.symbol} className="w-10 h-10 rounded-full mr-3" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#22C55E] flex items-center justify-center text-white mr-3">
                  {token.symbol[0]}
                </div>
              )}
              <div>
                <div className="font-semibold text-lg">{token.symbol}</div>
                <div className="text-sm text-gray-400">
                  {formatCurrency(price)} per {token.symbol}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-lg">
                {showBalances ? token.balance.toFixed(8) : '****'}
              </div>
              <div className="text-sm text-gray-400">
                ≈ {showBalances ? formatCurrency(totalValue) : '****'}
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  const totalTradingValue = getTotalValue(tradingBalances);
  const totalFundingValue = getTotalValue(fundingBalances);
  const totalAssetsValue = totalTradingValue + totalFundingValue;
  const allTokens = getAllTokens();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1E293B] rounded-lg w-full max-w-4xl h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Asset Wallets</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowBalances(!showBalances)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white"
              >
                {showBalances ? <Eye size={20} /> : <EyeOff size={20} />}
                <span>{showBalances ? 'Hide' : 'Show'} Balances</span>
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Total Assets Summary */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-[#2D3748] rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Assets Value</div>
              <div className="text-2xl font-bold text-[#22C55E]">
                {showBalances ? formatCurrency(totalAssetsValue) : '****'}
              </div>
            </div>
            <div className="bg-[#2D3748] rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Trading Account</div>
              <div className="text-xl font-semibold">
                {showBalances ? formatCurrency(totalTradingValue) : '****'}
              </div>
            </div>
            <div className="bg-[#2D3748] rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Funding Account</div>
              <div className="text-xl font-semibold">
                {showBalances ? formatCurrency(totalFundingValue) : '****'}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-6 bg-[#2D3748] rounded-lg p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-[#22C55E] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('trading')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'trading'
                  ? 'bg-[#22C55E] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Trading Account
            </button>
            <button
              onClick={() => setActiveTab('funding')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'funding'
                  ? 'bg-[#22C55E] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Funding Account
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">All Assets</h3>
                <div className="text-sm text-gray-400">
                  {allTokens.length} assets with balance
                </div>
              </div>
              {allTokens.length > 0 ? (
                allTokens.map(token => renderTokenRow(token, true))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-lg mb-2">No assets found</div>
                  <div className="text-sm">Make a deposit to get started</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'trading' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Trading Account Assets</h3>
                <div className="text-sm text-gray-400">
                  Total: {showBalances ? formatCurrency(totalTradingValue) : '****'}
                </div>
              </div>
              {renderAccountTokens(tradingBalances, 'Trading Account')}
            </div>
          )}

          {activeTab === 'funding' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Funding Account Assets</h3>
                <div className="text-sm text-gray-400">
                  Total: {showBalances ? formatCurrency(totalFundingValue) : '****'}
                </div>
              </div>
              {renderAccountTokens(fundingBalances, 'Funding Account')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetWalletsModal;