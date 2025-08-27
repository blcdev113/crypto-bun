import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { binanceWS } from '../services/binanceWebSocket';
import { useUser } from './UserContext';

interface Position {
  id: string;
  symbol: string;
  type: 'long' | 'short';
  entryPrice: number;
  amount: number;
  leverage: number;
  openTime: Date;
  closeTime?: Date;
  pnl?: number;
  pnlPercent?: number;
  status: 'open' | 'closed';
  initialBalance: number;
}

interface TokenBalance {
  symbol: string;
  balance: number;
}

interface ConversionRecord {
  id: string;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

interface PositionContextType {
  positions: Position[];
  portfolioBalance: number;
  tokenBalances: TokenBalance[];
  tradingBalances: TokenBalance[];
  fundingBalances: TokenBalance[];
  conversionHistory: ConversionRecord[];
  openPosition: (position: Omit<Position, 'id' | 'status' | 'openTime' | 'initialBalance'>) => Position;
  closePosition: (id: string) => void;
  updateUsdtBalance: (amount: number) => void;
  convertTokens: (fromToken: string, toToken: string, amount: number, rate: number) => void;
  transferBetweenAccounts: (from: 'trading' | 'funding', to: 'trading' | 'funding', token: string, amount: number) => void;
}

const PositionContext = createContext<PositionContextType | undefined>(undefined);

export const usePositions = () => {
  const context = useContext(PositionContext);
  if (!context) {
    throw new Error('usePositions must be used within a PositionProvider');
  }
  return context;
};

interface PositionProviderProps {
  children: ReactNode;
}

export const PositionProvider: React.FC<PositionProviderProps> = ({ children }) => {
  const { user } = useUser();
  const [positions, setPositions] = useState<Position[]>([]);
  const [portfolioBalance, setPortfolioBalance] = useState(10000);
  const [conversionHistory, setConversionHistory] = useState<ConversionRecord[]>([]);
  const [tradingBalances, setTradingBalances] = useState<TokenBalance[]>([
    { symbol: 'USDT', balance: 10000 },
    { symbol: 'BTC', balance: 0 },
    { symbol: 'ETH', balance: 0 },
    { symbol: 'SOL', balance: 0 },
    { symbol: 'BNB', balance: 0 },
    { symbol: 'XRP', balance: 0 },
    { symbol: 'ADA', balance: 0 },
    { symbol: 'DOGE', balance: 0 },
    { symbol: 'MATIC', balance: 0 },
    { symbol: 'DOT', balance: 0 }
  ]);
  const [fundingBalances, setFundingBalances] = useState<TokenBalance[]>([
    { symbol: 'USDT', balance: 0 },
    { symbol: 'BTC', balance: 0 },
    { symbol: 'ETH', balance: 0 },
    { symbol: 'SOL', balance: 0 },
    { symbol: 'BNB', balance: 0 },
    { symbol: 'XRP', balance: 0 },
    { symbol: 'ADA', balance: 0 },
    { symbol: 'DOGE', balance: 0 },
    { symbol: 'MATIC', balance: 0 },
    { symbol: 'DOT', balance: 0 }
  ]);
  const [currentPrices, setCurrentPrices] = useState<Map<string, number>>(new Map());

  // Reset balances when user logs in
  useEffect(() => {
    if (user) {
      setPortfolioBalance(10000);
      setTradingBalances([
        { symbol: 'USDT', balance: 10000 },
        { symbol: 'BTC', balance: 0 },
        { symbol: 'ETH', balance: 0 },
        { symbol: 'SOL', balance: 0 },
        { symbol: 'BNB', balance: 0 },
        { symbol: 'XRP', balance: 0 },
        { symbol: 'ADA', balance: 0 },
        { symbol: 'DOGE', balance: 0 },
        { symbol: 'MATIC', balance: 0 },
        { symbol: 'DOT', balance: 0 }
      ]);
      setFundingBalances([
        { symbol: 'USDT', balance: 0 },
        { symbol: 'BTC', balance: 0 },
        { symbol: 'ETH', balance: 0 },
        { symbol: 'SOL', balance: 0 },
        { symbol: 'BNB', balance: 0 },
        { symbol: 'XRP', balance: 0 },
        { symbol: 'ADA', balance: 0 },
        { symbol: 'DOGE', balance: 0 },
        { symbol: 'MATIC', balance: 0 },
        { symbol: 'DOT', balance: 0 }
      ]);
      setPositions([]);
      setConversionHistory([]);
    }
  }, [user]);

  // Subscribe to price updates and update PNL
  useEffect(() => {
    const unsubscribe = binanceWS.onPriceUpdate((data) => {
      const prices = new Map();
      data.forEach(token => prices.set(token.symbol, token.price));
      setCurrentPrices(prices);

      // Update P&L for open positions
      setPositions(prevPositions => 
        prevPositions.map(position => {
          if (position.status === 'closed') return position;

          const currentPrice = prices.get(position.symbol);
          if (!currentPrice) return position;

          // Calculate margin (collateral)
          const margin = (position.amount * position.entryPrice) / position.leverage;
          
          let pnl = 0;
          if (position.type === 'long') {
            // For long positions: (currentPrice - entryPrice) / entryPrice * margin * leverage
            const priceChange = (currentPrice - position.entryPrice) / position.entryPrice;
            pnl = priceChange * margin * position.leverage;
          } else {
            // For short positions: (entryPrice - currentPrice) / entryPrice * margin * leverage
            const priceChange = (position.entryPrice - currentPrice) / position.entryPrice;
            pnl = priceChange * margin * position.leverage;
          }

          // Calculate PNL percentage relative to margin
          const pnlPercent = (pnl / margin) * 100;

          return {
            ...position,
            pnl,
            pnlPercent
          };
        })
      );
    });

    return () => unsubscribe();
  }, []);

  const updateUsdtBalance = useCallback((amount: number) => {
    const newBalance = portfolioBalance + amount;
    setPortfolioBalance(newBalance);
    setTradingBalances(prev => prev.map(token => 
      token.symbol === 'USDT' ? { ...token, balance: token.balance + amount } : token
    ));
  }, [portfolioBalance]);

  const convertTokens = useCallback((fromToken: string, toToken: string, amount: number, rate: number) => {
    // Create conversion record
    const conversionRecord: ConversionRecord = {
      id: Math.random().toString(36).substring(7),
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: amount * rate,
      rate,
      timestamp: new Date(),
      status: 'completed'
    };

    setConversionHistory(prev => [conversionRecord, ...prev]);

    setTradingBalances(prev => {
      const newBalances = [...prev];
      const fromIndex = newBalances.findIndex(t => t.symbol === fromToken);
      const toIndex = newBalances.findIndex(t => t.symbol === toToken);

      if (fromIndex !== -1 && toIndex !== -1) {
        // Deduct from source token
        newBalances[fromIndex] = {
          ...newBalances[fromIndex],
          balance: Math.max(0, newBalances[fromIndex].balance - amount)
        };

        // Add to destination token
        const convertedAmount = amount * rate;
        newBalances[toIndex] = {
          ...newBalances[toIndex],
          balance: newBalances[toIndex].balance + convertedAmount
        };

        // Update portfolio balance if USDT is involved
        if (fromToken === 'USDT') {
          setPortfolioBalance(prev => prev - amount);
        } else if (toToken === 'USDT') {
          setPortfolioBalance(prev => prev + convertedAmount);
        }
      }

      return newBalances;
    });
  }, []);

  const openPosition = useCallback((positionData: Omit<Position, 'id' | 'status' | 'openTime' | 'initialBalance'>): Position => {
    // Calculate required margin
    const margin = (positionData.amount * positionData.entryPrice) / positionData.leverage;
    
    // Check if user has enough USDT balance in trading account for margin
    const tradingUsdtBalance = tradingBalances.find(t => t.symbol === 'USDT')?.balance || 0;
    if (margin > tradingUsdtBalance) {
      throw new Error('Insufficient balance to open position');
    }

    const id = Math.random().toString(36).substring(7);
    const newPosition: Position = {
      ...positionData,
      id,
      status: 'open',
      openTime: new Date(),
      initialBalance: portfolioBalance,
      pnl: 0,
      pnlPercent: 0
    };

    setPositions(prev => [...prev, newPosition]);
    
    // Deduct margin from trading account USDT balance
    setTradingBalances(prev => prev.map(token => 
      token.symbol === 'USDT' ? { ...token, balance: token.balance - margin } : token
    ));
    setPortfolioBalance(prev => prev - margin);
    
    return newPosition;
  }, [tradingBalances, portfolioBalance]);

  const transferBetweenAccounts = useCallback((from: 'trading' | 'funding', to: 'trading' | 'funding', token: string, amount: number) => {
    if (from === 'trading') {
      setTradingBalances(prev => prev.map(t => 
        t.symbol === token ? { ...t, balance: t.balance - amount } : t
      ));
      setFundingBalances(prev => prev.map(t => 
        t.symbol === token ? { ...t, balance: t.balance + amount } : t
      ));
    } else {
      setFundingBalances(prev => prev.map(t => 
        t.symbol === token ? { ...t, balance: t.balance - amount } : t
      ));
      setTradingBalances(prev => prev.map(t => 
        t.symbol === token ? { ...t, balance: t.balance + amount } : t
      ));
    }
  }, []);

  const closePosition = useCallback((id: string) => {
    setPositions(prev => {
      const position = prev.find(p => p.id === id);
      if (!position || position.status === 'closed') return prev;

      const currentPrice = currentPrices.get(position.symbol);
      if (!currentPrice) return prev;

      // Calculate margin
      const margin = (position.amount * position.entryPrice) / position.leverage;
      
      let pnl = 0;
      if (position.type === 'long') {
        // For long positions: (currentPrice - entryPrice) / entryPrice * margin * leverage
        const priceChange = (currentPrice - position.entryPrice) / position.entryPrice;
        pnl = priceChange * margin * position.leverage;
      } else {
        // For short positions: (entryPrice - currentPrice) / entryPrice * margin * leverage
        const priceChange = (position.entryPrice - currentPrice) / position.entryPrice;
        pnl = priceChange * margin * position.leverage;
      }

      // Calculate PNL percentage relative to margin
      const pnlPercent = (pnl / margin) * 100;

      // Return margin + PNL to trading account
      const totalReturn = margin + pnl;
      setTradingBalances(prev => prev.map(token => 
        token.symbol === 'USDT' ? { ...token, balance: token.balance + totalReturn } : token
      ));
      setPortfolioBalance(prev => prev + totalReturn);

      return prev.map(pos =>
        pos.id === id ? {
          ...pos,
          status: 'closed',
          closeTime: new Date(),
          pnl,
          pnlPercent
        } : pos
      );
    });
  }, [currentPrices]);

  return (
    <PositionContext.Provider value={{ 
      positions, 
      portfolioBalance, 
      tokenBalances: tradingBalances,
      tradingBalances,
      fundingBalances,
      conversionHistory,
      openPosition, 
      closePosition, 
      updateUsdtBalance,
      convertTokens,
      transferBetweenAccounts
    }}>
      {children}
    </PositionContext.Provider>
  );
};