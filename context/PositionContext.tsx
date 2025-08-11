import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { binanceWS } from '../services/binanceWebSocket';
import { useUser } from './UserContext';
import { createClient } from '@supabase/supabase-js';

// Validate Supabase environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

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

interface PositionContextType {
  positions: Position[];
  portfolioBalance: number;
  tokenBalances: TokenBalance[];
  openPosition: (position: Omit<Position, 'id' | 'status' | 'openTime' | 'initialBalance'>) => Position;
  closePosition: (id: string) => void;
  updateUsdtBalance: (amount: number) => void;
  convertTokens: (fromToken: string, toToken: string, amount: number, rate: number) => void;
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
  const [portfolioBalance, setPortfolioBalance] = useState(0);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [currentPrices, setCurrentPrices] = useState<Map<string, number>>(new Map());

  // Initialize or load user's balance
  useEffect(() => {
    const initializeUserBalance = async () => {
      if (!user) {
        console.log('No user found, skipping balance initialization');
        return;
      }

      try {
        console.log('Attempting to initialize user balance for user:', user.id);
        
        // First, check if we can connect to Supabase
        const { error: healthCheckError } = await supabase.from('user_balances').select('count').limit(1);
        if (healthCheckError) {
          throw new Error(`Supabase connection check failed: ${healthCheckError.message}`);
        }

        // Update user's balance to 10,000 USDT
        const { data: updatedBalance, error: updateError } = await supabase
          .from('user_balances')
          .upsert(
            { user_id: user.id, balance: 10000 },
            { onConflict: 'user_id' }
          )
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to update balance: ${updateError.message}`);
        }

        if (updatedBalance) {
          console.log('Successfully updated user balance:', updatedBalance);
          setPortfolioBalance(10000);
          setTokenBalances([
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
        } else {
          console.error('No balance data returned after update');
        }
      } catch (error) {
        console.error('Error updating user balance:', error);
        throw error;
      }
    };

    initializeUserBalance().catch(error => {
      console.error('Failed to initialize user balance:', error);
    });
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

  const updateUsdtBalance = useCallback(async (amount: number) => {
    if (!user) {
      console.warn('Cannot update balance: No user logged in');
      return;
    }

    const newBalance = portfolioBalance + amount;
    
    try {
      console.log('Attempting to update USDT balance for user:', user.id);
      
      // Update balance in database
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Failed to update balance: ${updateError.message}`);
      }

      console.log('Successfully updated balance to:', newBalance);
      
      // Update local state
      setPortfolioBalance(newBalance);
      setTokenBalances(prev => prev.map(token => 
        token.symbol === 'USDT' ? { ...token, balance: token.balance + amount } : token
      ));
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error;
    }
  }, [portfolioBalance, user]);

  const convertTokens = useCallback((fromToken: string, toToken: string, amount: number, rate: number) => {
    setTokenBalances(prev => {
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
    
    // Check if user has enough balance for margin
    if (margin > portfolioBalance) {
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
    return newPosition;
  }, [portfolioBalance]);

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

      // Update user's balance with PNL
      updateUsdtBalance(pnl);

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
  }, [currentPrices, updateUsdtBalance]);

  return (
    <PositionContext.Provider value={{ 
      positions, 
      portfolioBalance, 
      tokenBalances,
      openPosition, 
      closePosition, 
      updateUsdtBalance,
      convertTokens 
    }}>
      {children}
    </PositionContext.Provider>
  );
};