import React, { useState } from 'react';
import { X, Search, ChevronRight, Copy, ArrowLeft } from 'lucide-react';
import { cryptoLogos } from '../utils/cryptoLogos';
import QRCode from 'qrcode.react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Network {
  name: string;
  protocol: string;
  fee: string;
  time: string;
  min: string;
  address?: string;
}

const USDT_NETWORKS: Network[] = [
  {
    name: 'Ethereum (ERC20)',
    protocol: 'ERC20',
    fee: '10-25 USDT',
    time: '10-30 mins',
    min: '25 USDT',
    address: '0xA1E3B4288366e32ffD4AECF6D512b5b18dBA5595'
  },
  {
    name: 'Tron (TRC20)',
    protocol: 'TRC20',
    fee: '1 USDT',
    time: '1-3 mins',
    min: '1 USDT',
    address: 'TLBJwHWe2o3S5sW8MMdrRtZcuxSQNBqnC3'
  }
];

const TOKENS = [
  { symbol: 'USDT', name: 'Tether USD' },
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'TRX', name: 'TRON' },
  { symbol: 'USDC', name: 'USD Coin' },
  { symbol: 'BNB', name: 'BNB' },
  { symbol: 'XRP', name: 'XRP' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' }
];

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'crypto' | 'fiat'>('crypto');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [showAddressCopied, setShowAddressCopied] = useState(false);

  if (!isOpen) return null;

  const filteredTokens = TOKENS.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setShowAddressCopied(true);
    setTimeout(() => setShowAddressCopied(false), 2000);
  };

  const renderTokenList = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-400 mb-2">History</h3>
        <div className="grid grid-cols-3 gap-2">
          {TOKENS.slice(0, 6).map(token => (
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
        <h3 className="text-sm font-medium text-gray-400 mb-2">Hot</h3>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {TOKENS.slice(0, 6).map(token => (
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

      <div className="space-y-2">
        {filteredTokens.map(token => {
          const logo = cryptoLogos[token.symbol];
          return (
            <button
              key={token.symbol}
              className="w-full flex items-center p-3 hover:bg-[#2D3748] rounded-lg transition-colors"
              onClick={() => setSelectedToken(token.symbol)}
            >
              {logo ? (
                <img src={logo} alt={token.symbol} className="w-8 h-8 rounded-full mr-3" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white mr-3">
                  {token.symbol[0]}
                </div>
              )}
              <div className="text-left">
                <div className="font-medium">{token.symbol}</div>
                <div className="text-sm text-gray-400">{token.name}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderNetworkSelection = () => {
    const token = TOKENS.find(t => t.symbol === selectedToken);
    if (!token) return null;

    const networks = token.symbol === 'USDT' ? USDT_NETWORKS : [];
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
              <div className="text-sm text-gray-400">{token.name}</div>
            </div>
          </div>
        </div>

        <div className="bg-[#2D3748] p-4 rounded-lg mb-4">
          <div className="flex items-center text-yellow-500 mb-2">
            <span className="text-sm">⚠️ Make sure you select the deposit network that corresponds to the withdrawal platform. Failure to do so may result in the loss of your funds.</span>
          </div>
          <a href="#" className="text-[#22C55E] text-sm hover:underline">Learn How to Select Deposit Network</a>
        </div>

        {networks.length > 0 ? (
          <div className="space-y-3">
            {networks.map((network) => (
              <button
                key={network.protocol}
                className="w-full bg-[#2D3748] hover:bg-[#374151] rounded-lg p-4 text-left transition-colors"
                onClick={() => setSelectedNetwork(network)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-medium">{network.protocol}</span>
                    <span className="text-gray-400 ml-2">{network.name.split('(')[0].trim()}</span>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
                <div className="text-sm text-gray-400">
                  <div>Arrival Time ≈ {network.time}</div>
                  <div>Min Deposit: {network.min}</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-8">
            Network selection not available for {token.symbol}
          </div>
        )}
      </>
    );
  };

  const renderDepositAddress = () => {
    if (!selectedNetwork || !selectedToken) return null;
    const token = TOKENS.find(t => t.symbol === selectedToken);
    const logo = cryptoLogos[selectedToken];

    return (
      <>
        <div className="flex items-center mb-6">
          <button onClick={() => setSelectedNetwork(null)} className="text-gray-400 hover:text-white mr-3">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-semibold">Deposit {selectedToken}</h2>
        </div>

        <div className="flex justify-center mb-6">
          <QRCode 
            value={selectedNetwork.address || ''} 
            size={200}
            level="H"
            imageSettings={{
              src: logo || '',
              height: 40,
              width: 40,
              excavate: true
            }}
          />
        </div>

        <div className="text-center text-gray-400 mb-6">
          For {selectedToken} deposit only
        </div>

        <div className="space-y-4">
          <div className="bg-[#2D3748] rounded-lg">
            <div className="p-4 border-b border-gray-700">
              <div className="text-sm text-gray-400">Network</div>
              <div className="font-medium">{selectedNetwork.protocol} {selectedNetwork.name.split('(')[1].replace(')', '')}</div>
            </div>
            <div className="p-4">
              <div className="text-sm text-gray-400 mb-2">Address</div>
              <div className="flex items-center justify-between bg-[#374151] p-3 rounded">
                <div className="font-mono text-sm break-all">{selectedNetwork.address}</div>
                <button 
                  onClick={() => handleCopyAddress(selectedNetwork.address || '')}
                  className="ml-2 text-[#22C55E] hover:text-[#16A34A]"
                >
                  <Copy size={20} />
                </button>
              </div>
              {showAddressCopied && (
                <div className="text-[#22C55E] text-sm mt-1">Address copied!</div>
              )}
            </div>
          </div>

          <div className="bg-[#2D3748] rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Deposit to</span>
              <span>Trading Account</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Min Deposit</span>
              <span>{selectedNetwork.min} {selectedToken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Expected Arrival</span>
              <span>{selectedNetwork.time}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-4 mt-6">
          <button className="flex-1 bg-[#2D3748] text-white py-3 rounded-lg font-medium hover:bg-[#374151] transition-all duration-200">
            Save Image
          </button>
          <button className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white py-3 rounded-lg font-medium transition-all duration-200">
            Share Address
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1E293B] rounded-lg w-full max-w-md h-[80vh] flex flex-col">
        {!selectedNetwork && (
          <div className="p-4 border-b border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Deposit</h2>
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
        )}

        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'crypto' ? (
            selectedNetwork ? (
              renderDepositAddress()
            ) : selectedToken ? (
              renderNetworkSelection()
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
                <p className="text-gray-400">Fiat deposits will be available shortly</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepositModal;