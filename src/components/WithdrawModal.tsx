import React, { useState } from 'react';
import { X, Search, ChevronRight, Copy, ArrowLeft, Clipboard, Check, Loader2 } from 'lucide-react';
import { cryptoLogos } from '../utils/cryptoLogos';
import { usePositions } from '../context/PositionContext';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Network {
  name: string;
  protocol: string;
  fee: string;
  time: string;
  min: string;
}

const USDT_NETWORKS: Network[] = [
  {
    name: 'Ethereum (ERC20)',
    protocol: 'ERC20',
    fee: '10-25 USDT',
    time: '10-30 mins',
    min: '25 USDT'
  },
  {
    name: 'Tron (TRC20)',
    protocol: 'TRC20',
    fee: '1 USDT',
    time: '1-3 mins',
    min: '1 USDT'
  }
];

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'crypto' | 'fiat'>('crypto');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [showNetworkList, setShowNetworkList] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [withdrawalDetails, setWithdrawalDetails] = useState<any>(null);
  const { tokenBalances } = usePositions();

  if (!isOpen) return null;

  const calculateFee = () => {
    if (!selectedNetwork) return 0;
    return selectedNetwork.protocol === 'ERC20' ? 15 : 1;
  };

  const handleWithdraw = () => {
    if (!selectedNetwork || !withdrawalAmount || !walletAddress) return;

    const details = {
      token: selectedToken,
      network: selectedNetwork.protocol,
      amount: parseFloat(withdrawalAmount),
      address: walletAddress,
      fee: calculateFee(),
      timestamp: new Date().toISOString()
    };

    setWithdrawalDetails(details);
    setIsProcessing(true);

    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false);
      setShowSuccess(true);

      // Close modal after showing success
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        // Reset form
        setSelectedToken(null);
        setSelectedNetwork(null);
        setWithdrawalAmount('');
        setWalletAddress('');
      }, 2000);
    }, 2000);
  };

  const handleSetMaxAmount = () => {
    const token = tokenBalances.find(t => t.symbol === selectedToken);
    if (token) {
      setWithdrawalAmount(token.balance.toString());
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#1E293B] rounded-lg w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Withdrawal Initiated!</h2>
          <p className="text-gray-400 mb-4">
            Your withdrawal request has been submitted successfully.
          </p>
          <div className="bg-[#2D3748] rounded-lg p-4 text-left">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-400">Amount:</div>
              <div>{withdrawalDetails.amount} {withdrawalDetails.token}</div>
              <div className="text-gray-400">Network:</div>
              <div>{withdrawalDetails.network}</div>
              <div className="text-gray-400">Fee:</div>
              <div>{withdrawalDetails.fee} {withdrawalDetails.token}</div>
              <div className="text-gray-400">Status:</div>
              <div className="text-[#22C55E]">Processing</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#1E293B] rounded-lg w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-[#2D3748] rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 size={32} className="text-[#22C55E] animate-spin" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Processing Withdrawal</h2>
          <p className="text-gray-400">
            Please wait while we process your withdrawal request.
          </p>
        </div>
      </div>
    );
  }

  const renderTokenList = () => {
    const filteredTokens = tokenBalances.filter(token =>
      token.balance > 0 && token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">History</h3>
          <div className="grid grid-cols-3 gap-2">
            {filteredTokens.slice(0, 6).map(token => (
              <button
                key={token.symbol}
                className="bg-[#2D3748] hover:bg-[#374151] rounded-lg py-2 text-center transition-colors"
                onClick={() => setSelectedToken(token.symbol)}
              >
                {token.symbol}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Available for Withdrawal</h3>
          <div className="space-y-2">
            {filteredTokens.map(token => {
              const logo = cryptoLogos[token.symbol];
              return (
                <button
                  key={token.symbol}
                  className="w-full flex items-center justify-between p-3 hover:bg-[#2D3748] rounded-lg transition-colors"
                  onClick={() => setSelectedToken(token.symbol)}
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
                      ${(token.balance * (token.symbol === 'USDT' ? 1 : 100)).toFixed(2)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWithdrawalForm = () => {
    const token = tokenBalances.find(t => t.symbol === selectedToken);
    if (!token) return null;

    const logo = cryptoLogos[token.symbol];

    return (
      <>
        <div className="flex items-center mb-6">
          <button onClick={() => setSelectedToken(null)} className="text-gray-400 hover:text-white mr-3">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center">
            {logo ? (
              <img src={logo} alt={token.symbol} className="w-8 h-8 rounded-full mr-3" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white mr-3">
                {token.symbol[0]}
              </div>
            )}
            <div>
              <div className="font-medium">{token.symbol}</div>
              <div className="text-sm text-gray-400">Tether</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Wallet Address</label>
            <div className="relative">
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Press and hold to paste"
                className="w-full bg-[#2D3748] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#22C55E]"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-2">
                <button className="text-[#22C55E] hover:text-[#16A34A] p-1">
                  Address Book
                </button>
                <button className="text-[#22C55E] hover:text-[#16A34A] p-1">
                  <Clipboard size={18} />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Network</label>
            <div className="relative">
              <button
                className="w-full bg-[#2D3748] hover:bg-[#374151] rounded-lg p-3 text-left flex items-center justify-between"
                onClick={() => setShowNetworkList(!showNetworkList)}
              >
                {selectedNetwork ? (
                  <>
                    <span>{selectedNetwork.protocol} {selectedNetwork.name.split('(')[1].replace(')', '')}</span>
                    <span className="text-sm text-gray-400">Fee: {selectedNetwork.fee}</span>
                  </>
                ) : (
                  <span className="text-gray-400">Select a network</span>
                )}
                <ChevronRight size={20} className="text-gray-400" />
              </button>

              {showNetworkList && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#2D3748] rounded-lg shadow-lg z-10">
                  {USDT_NETWORKS.map((network) => (
                    <button
                      key={network.protocol}
                      className="w-full p-3 hover:bg-[#374151] text-left"
                      onClick={() => {
                        setSelectedNetwork(network);
                        setShowNetworkList(false);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{network.protocol}</span>
                          <span className="text-gray-400 ml-2">{network.name.split('(')[0].trim()}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        <div>Arrival Time ≈ {network.time}</div>
                        <div>Min Withdrawal: {network.min}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Withdrawal Amount</label>
            <div className="relative">
              <input
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder={`Min amount 0 ${token.symbol}`}
                className="w-full bg-[#2D3748] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#22C55E]"
              />
              <button
                onClick={handleSetMaxAmount}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#22C55E] hover:text-[#16A34A] text-sm"
              >
                Max
              </button>
            </div>
            <div className="mt-2 text-sm">
              <div className="flex items-center text-gray-400">
                <span>Available {token.balance.toFixed(8)} {token.symbol}</span>
                <button className="ml-2 text-[#22C55E]">
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="flex items-center mt-1">
                <div className="flex items-center text-[#22C55E] bg-[#22C55E] bg-opacity-10 px-2 py-0.5 rounded">
                  <span>Funding Account</span>
                  <span className="ml-2">0.00</span>
                  <span className="ml-1">Priority</span>
                </div>
              </div>
              <div className="flex items-center mt-1">
                <div className="flex items-center text-[#22C55E] bg-[#22C55E] bg-opacity-10 px-2 py-0.5 rounded">
                  <span>Trading Account</span>
                  <span className="ml-2">{token.balance.toFixed(8)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#2D3748] rounded-lg p-4">
            <h4 className="text-gray-400 mb-2">Note:</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Daily withdrawal amount: The remaining daily withdrawal amount is 999,999 USDT. The maximum withdrawal amount is 999,999 USDT.</li>
              <li>Do not withdraw to an ICO or crowd funding address.</li>
              <li>We will process your withdrawal within 30 minutes. The time it takes for the assets to transfer to your wallet depends on the selected network.</li>
              <li>To enhance the security of your assets, large withdrawals may be processed manually.</li>
              <li>Withdrawals will be deducted from your Funding Account first, then your Trading Account.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-400">Amount Received</span>
            <span>{withdrawalAmount ? `${(parseFloat(withdrawalAmount) - calculateFee()).toFixed(2)} ${token.symbol}` : `-- ${token.symbol}`}</span>
          </div>
          <div className="flex justify-between items-center text-sm mb-4">
            <span className="text-gray-400">Fee</span>
            <span>{selectedNetwork ? `${calculateFee()} ${token.symbol}` : `0 ${token.symbol}`}</span>
          </div>
          <button
            onClick={handleWithdraw}
            disabled={!withdrawalAmount || !walletAddress || !selectedNetwork}
            className="w-full bg-[#22C55E] hover:bg-[#16A34A] disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all duration-200"
          >
            Withdraw
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1E293B] rounded-lg w-full max-w-md h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Withdraw</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="flex space-x-4">
            <button
              className={`flex-1 py-2 text-center rounded-lg transition-colors ${
                activeTab === 'crypto'
                  ? 'bg-[#22C55E] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('crypto')}
            >
              Crypto
            </button>
            <button
              className={`flex-1 py-2 text-center rounded-lg transition-colors ${
                activeTab === 'fiat'
                  ? 'bg-[#22C55E] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('fiat')}
            >
              Fiat
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'crypto' ? (
            selectedToken ? (
              renderWithdrawalForm()
            ) : (
              <>
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#2D3748] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  />
                  <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
                </div>
                {renderTokenList()}
              </>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                <p className="text-gray-400">Fiat withdrawals will be available shortly</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;