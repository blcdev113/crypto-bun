import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeftRight, Check, Loader2 } from 'lucide-react';
import { TokenPrice } from '../services/binanceWebSocket';
import { formatCurrency } from '../utils/formatters';
import { cryptoLogos } from '../utils/cryptoLogos';
import TokenList from './TokenList';
import { usePositions } from '../context/PositionContext';

interface ConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  prices: TokenPrice[];
  tokenBalances: { symbol: string; balance: number }[];
}

const ConvertModal: React.FC<ConvertModalProps> = ({ isOpen, onClose, prices, tokenBalances }) => {
  const [fromToken, setFromToken] = useState('USDT');
  const [toToken, setToToken] = useState('BTCUSDT');
  const [amount, setAmount] = useState('');
  const [showFromTokenList, setShowFromTokenList] = useState(false);
  const [showToTokenList, setShowToTokenList] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionTimer, setConversionTimer] = useState(5);
  const { portfolioBalance, convertTokens } = usePositions();
  
  const fromTokenListRef = useRef<HTMLDivElement>(null);
  const toTokenListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromTokenListRef.current && !fromTokenListRef.current.contains(event.target as Node)) {
        setShowFromTokenList(false);
      }
      if (toTokenListRef.current && !toTokenListRef.current.contains(event.target as Node)) {
        setShowToTokenList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModalClose = () => {
    setFromToken('USDT');
    setToToken('BTCUSDT');
    setAmount('');
    setShowFromTokenList(false);
    setShowToTokenList(false);
    setShowSuccess(false);
    setIsConverting(false);
    setConversionTimer(5);
    onClose();
  };

  const getTokenSymbol = (symbol: string) => symbol.replace('USDT', '');

  const fromTokenData = fromToken === 'USDT' 
    ? { symbol: 'USDT', price: 1, priceChange: 0, volume: 0 }
    : prices.find(p => p.symbol === fromToken);
  const toTokenData = toToken === 'USDT'
    ? { symbol: 'USDT', price: 1, priceChange: 0, volume: 0 }
    : prices.find(p => p.symbol === toToken);
  
  const fromSymbol = fromToken === 'USDT' ? 'USDT' : getTokenSymbol(fromToken);
  const toSymbol = toToken === 'USDT' ? 'USDT' : getTokenSymbol(toToken);
  
  const fromLogo = cryptoLogos[fromSymbol];
  const toLogo = cryptoLogos[toSymbol];

  const fromBalance = tokenBalances.find(t => t.symbol === fromSymbol)?.balance || 0;
  const toBalance = tokenBalances.find(t => t.symbol === toSymbol)?.balance || 0;

  const calculateConversion = () => {
    if (!fromTokenData || !toTokenData || !amount) return '0';
    
    if (fromSymbol === 'USDT') {
      return (parseFloat(amount) / toTokenData.price).toFixed(8);
    } else if (toSymbol === 'USDT') {
      return (parseFloat(amount) * fromTokenData.price).toFixed(2);
    } else {
      const usdtValue = parseFloat(amount) * fromTokenData.price;
      return (usdtValue / toTokenData.price).toFixed(8);
    }
  };

  const getConversionRate = () => {
    if (!fromTokenData || !toTokenData) return 1;
    
    if (fromSymbol === 'USDT') {
      return 1 / toTokenData.price;
    } else if (toSymbol === 'USDT') {
      return fromTokenData.price;
    } else {
      return fromTokenData.price / toTokenData.price;
    }
  };

  const getMaxAmount = () => {
    return fromBalance;
  };

  const handleSetMaxAmount = () => {
    setAmount(getMaxAmount().toString());
  };

  const handleFromTokenSelect = (token: string) => {
    if (token === toToken) {
      setToToken(fromToken);
    }
    setFromToken(token);
    setShowFromTokenList(false);
    setAmount('');
  };

  const handleToTokenSelect = (token: string) => {
    if (token === fromToken) {
      setFromToken(toToken);
    }
    setToToken(token);
    setShowToTokenList(false);
    setAmount('');
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isConverting && conversionTimer > 0) {
      timer = setInterval(() => {
        setConversionTimer(prev => prev - 1);
      }, 1000);
    } else if (isConverting && conversionTimer === 0) {
      const amountNum = parseFloat(amount);
      const rate = getConversionRate();
      
      convertTokens(fromSymbol, toSymbol, amountNum, rate);
      setIsConverting(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        handleModalClose();
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [isConverting, conversionTimer]);

  const handleConvert = () => {
    setIsConverting(true);
  };

  if (!isOpen) return null;

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#1E293B] rounded-lg w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Conversion Successful!</h2>
          <p className="text-gray-400">
            Converted {amount} {fromSymbol} to {calculateConversion()} {toSymbol}
          </p>
        </div>
      </div>
    );
  }

  if (isConverting) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#1E293B] rounded-lg w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-[#2D3748] rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 size={32} className="text-[#22C55E] animate-spin" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Converting {fromSymbol} to {toSymbol}</h2>
          <p className="text-gray-400">
            Please wait {conversionTimer} seconds while we process your conversion at the current market rate.
          </p>
          <div className="mt-4 h-2 bg-[#2D3748] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#22C55E] transition-all duration-1000"
              style={{ width: `${((5 - conversionTimer) / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1E293B] rounded-lg w-full max-w-md p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Convert</h2>
          <button onClick={handleModalClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* From Token */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-400">From</label>
            <div className="text-sm text-gray-400">
              Balance: {fromSymbol === 'USDT' ? formatCurrency(fromBalance) : fromBalance.toFixed(8)} {fromSymbol}
            </div>
          </div>
          <div className="relative" ref={fromTokenListRef}>
            <div 
              className="bg-[#2D3748] p-3 rounded-lg flex items-center justify-between cursor-pointer"
              onClick={() => setShowFromTokenList(true)}
            >
              <div className="flex items-center">
                {fromLogo ? (
                  <img src={fromLogo} alt={fromSymbol} className="w-8 h-8 rounded-full mr-3" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white mr-3">
                    {fromSymbol.substring(0, 1)}
                  </div>
                )}
                <div>
                  <div className="font-medium">{fromSymbol}</div>
                  <div className="text-sm text-gray-400">
                    {fromTokenData ? formatCurrency(fromTokenData.price) : '-'}
                  </div>
                </div>
              </div>
            </div>

            {showFromTokenList && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#2D3748] rounded-lg shadow-lg z-10">
                <TokenList onSelect={handleFromTokenSelect} />
              </div>
            )}
          </div>

          <div className="relative mt-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#2D3748] p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            />
            <button
              onClick={handleSetMaxAmount}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-[#22C55E] hover:text-[#16A34A]"
            >
              MAX
            </button>
          </div>
          
          <div className="text-sm text-gray-400 mt-1">
            ≈ {amount && fromTokenData ? formatCurrency(parseFloat(amount) * fromTokenData.price) : '$0.00'}
          </div>
        </div>

        {/* Swap Button */}
        <button 
          className="mx-auto block p-2 rounded-full bg-[#2D3748] hover:bg-[#374151] mb-4"
          onClick={() => {
            const temp = fromToken;
            setFromToken(toToken);
            setToToken(temp);
            setAmount('');
          }}
        >
          <ArrowLeftRight className="text-[#22C55E]" />
        </button>

        {/* To Token */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-400">To</label>
            <div className="text-sm text-gray-400">
              Balance: {toSymbol === 'USDT' ? formatCurrency(toBalance) : toBalance.toFixed(8)} {toSymbol}
            </div>
          </div>
          <div className="relative" ref={toTokenListRef}>
            <div 
              className="bg-[#2D3748] p-3 rounded-lg flex items-center justify-between cursor-pointer"
              onClick={() => setShowToTokenList(true)}
            >
              <div className="flex items-center">
                {toLogo ? (
                  <img src={toLogo} alt={toSymbol} className="w-8 h-8 rounded-full mr-3" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white mr-3">
                    {toSymbol.substring(0, 1)}
                  </div>
                )}
                <div>
                  <div className="font-medium">{toSymbol}</div>
                  <div className="text-sm text-gray-400">
                    {toTokenData ? formatCurrency(toTokenData.price) : '-'}
                  </div>
                </div>
              </div>
            </div>

            {showToTokenList && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#2D3748] rounded-lg shadow-lg z-10">
                <TokenList onSelect={handleToTokenSelect} />
              </div>
            )}
          </div>

          <div className="bg-[#2D3748] mt-2 p-3 rounded-lg">
            <div className="text-lg">{calculateConversion()}</div>
            <div className="text-sm text-gray-400">
              ≈ {amount && toTokenData ? formatCurrency(parseFloat(calculateConversion()) * toTokenData.price) : '$0.00'}
            </div>
          </div>
        </div>

        <button 
          className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white py-3 rounded-lg font-medium transition-all duration-200"
          onClick={handleConvert}
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > getMaxAmount()}
        >
          {!amount || parseFloat(amount) <= 0 ? 'Enter an amount' :
           parseFloat(amount) > getMaxAmount() ? 'Insufficient balance' :
           'Convert Now'}
        </button>
      </div>
    </div>
  );
};

export default ConvertModal;