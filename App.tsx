import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { TokenProvider } from './context/TokenContext';
import { PositionProvider } from './context/PositionContext';
import { UserProvider } from './context/UserContext';
import ExchangeLayout from './layouts/ExchangeLayout';

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <TokenProvider>
          <PositionProvider>
            <ExchangeLayout />
          </PositionProvider>
        </TokenProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;