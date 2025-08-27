import React, { useState } from 'react';
import { X, ArrowRightLeft, ArrowLeft } from 'lucide-react';
import { cryptoLogos } from '../utils/cryptoLogos';
import { formatCurrency } from '../utils/formatters';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradingBalances: { symbol: string; balance: number }[];
  fundingBalances: { symbol: string; balance: number }[];
  onTransfer: (from: 'trading' | 'funding', to: 'trading' | 'funding', token: string, amount: number) => void;
}

const TransferModal: React.FC<TransferModalProps> = ({ 
  isOpen, 
  onClose, 
  tradingBalances, 
  fundingBalances, 
  onTransfer 
}) => {
  const [fromAccount, setFromAccount] = useState<'trading' | 'funding'>('trading');
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [showTokenList, setShowTokenList] = useState(false);

  if (!isOpen) return null;

  const toAccount = fromAccount === 'trading' ? 'funding' : 'trading';
  const sourceBalances = fromAccount === 'trading' ? tradingBalances : fundingBalances;
  const availableTokens = sourceBalances.filter(token => token.balance > 0);

  const handleTransfer = () => {
    if (!selectedToken || !amount || parseFloat(amount) <= 0) return;
    
    const transferAmount = parseFloat(amount);
    const tokenBalance = sourceBalances.find(t => t.symbol === selectedToken)?.balance || 0;
    
    if (transferAmount > tokenBalance) return;

    onTransfer(fromAccount, toAccount, selectedToken, transferAmount);
    
    // Reset form
    setAmount('');
    setSelectedToken(null);
    onClose();
  };

  const handleSetMaxAmount = () => {
    if (selectedToken) {
      const tokenBalance = sourceBalances.find(t => t.symbol === selectedToken)?.balance || 0;
      setAmount(tokenBalance.toString());
    }
  };

  const getTokenPrice = (symbol: string) => {
    return symbol === 'USDT' ? 1 : 100; // Simplified pricing
  };

  if (showTokenList) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#1E293B] rounded-lg w-full max-w-md h-[80vh] flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center">
              <button onClick={() => setShowTokenList(false)} className="text-gray-400 hover:text-white mr-3">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-xl font-semibold">Select Token</h2>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {availableTokens.map(token => {
                const logo = cryptoLogos[token.symbol];
                const price = getTokenPrice(token.symbol);
                const usdValue = token.balance * price;
                
                return (
                  <button
                    key={token.symbol}
                    className="w-full flex items-center justify-between p-3 hover:bg-[#2D3748] rounded-lg transition-colors"
                    onClick={() => {
                      setSelectedToken(token.symbol);
                      setShowTokenList(false);
                    }}
                  >
                    <div className="flex items-center">
                      {logo ? (
                        <img src={logo} alt={token.symbol} className="w-8 h-8 rounded-full mr-3" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white mr-3">
                          {token.symbol[0]}
                        </div>
                      )}
                      <div className="text-left">
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-sm text-gray-400">{token.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div>{token.balance.toFixed(8)}</div>
                      <div className="text-sm text-gray-400">
                        {formatCurrency(usdValue)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1E293B] rounded-lg w-full max-w-md p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Transfer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Account Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between bg-[#2D3748] rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">From</div>
              <div className="font-medium capitalize">{fromAccount} Account</div>
            </div>
            
            <button
              onClick={() => setFromAccount(fromAccount === 'trading' ? 'funding' : 'trading')}
              className="p-2 bg-[#374151] hover:bg-[#4A5568] rounded-full transition-colors"
            >
              <ArrowRightLeft size={20} className="text-[#22C55E]" />
            </button>
            
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">To</div>
              <div className="font-medium capitalize">{toAccount} Account</div>
            </div>
          </div>
        </div>

        {/* Token Selection */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Select Token</label>
          <button
            onClick={() => setShowTokenList(true)}
            className="w-full bg-[#2D3748] hover:bg-[#374151] rounded-lg p-3 text-left transition-colors"
          >
            {selectedToken ? (
              <div className="flex items-center">
                {cryptoLogos[selectedToken] ? (
                  <img 
                    src={cryptoLogos[selectedToken]} 
                    alt={selectedToken} 
                    className="w-8 h-8 rounded-full mr-3" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white mr-3">
                    {selectedToken[0]}
                  </div>
                )}
                <div>
                  <div className="font-medium">{selectedToken}</div>
                  <div className="text-sm text-gray-400">
                    Available: {sourceBalances.find(t => t.symbol === selectedToken)?.balance.toFixed(8)} {selectedToken}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400">Select a token to transfer</div>
            )}
          </button>
        </div>

        {/* Amount Input */}
        {selectedToken && (
          <div className="mb-6">
            <label className="text-sm text-gray-400 mb-2 block">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#2D3748] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              />
              <button
                onClick={handleSetMaxAmount}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-[#22C55E] hover:text-[#16A34A]"
              >
                MAX
              </button>
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Available: {sourceBalances.find(t => t.symbol === selectedToken)?.balance.toFixed(8)} {selectedToken}
            </div>
          </div>
        )}

        {/* Transfer Summary */}
        {selectedToken && amount && (
          <div className="bg-[#2D3748] rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium mb-3">Transfer Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">From:</span>
                <span className="capitalize">{fromAccount} Account</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">To:</span>
                <span className="capitalize">{toAccount} Account</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span>{amount} {selectedToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fee:</span>
                <span className="text-[#22C55E]">Free</span>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Button */}
        <button
          onClick={handleTransfer}
          disabled={!selectedToken || !amount || parseFloat(amount) <= 0}
          className="w-full bg-[#22C55E] hover:bg-[#16A34A] disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all duration-200"
        >
          {!selectedToken ? 'Select Token' :
           !amount || parseFloat(amount) <= 0 ? 'Enter Amount' :
           parseFloat(amount) > (sourceBalances.find(t => t.symbol === selectedToken)?.balance || 0) ? 'Insufficient Balance' :
           'Transfer Now'}
        </button>
      </div>
    </div>
  );
};

export default TransferModal;