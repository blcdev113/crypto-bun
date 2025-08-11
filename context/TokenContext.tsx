import React, { createContext, useState, useContext, ReactNode } from 'react';

interface TokenContextType {
  selectedToken: string;
  setSelectedToken: (token: string) => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const useToken = () => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error('useToken must be used within a TokenProvider');
  }
  return context;
};

interface TokenProviderProps {
  children: ReactNode;
}

export const TokenProvider = ({ children }: TokenProviderProps) => {
  const [selectedToken, setSelectedToken] = useState('BTCUSDT');

  return (
    <TokenContext.Provider value={{ selectedToken, setSelectedToken }}>
      {children}
    </TokenContext.Provider>
  );
};