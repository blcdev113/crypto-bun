import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { TokenProvider } from './context/TokenContext';
import { PositionProvider } from './context/PositionContext';
import { UserProvider } from './context/UserContext';
import ExchangeLayout from './layouts/ExchangeLayout';
import ResetPasswordForm from './components/ResetPasswordForm';

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <TokenProvider>
          <PositionProvider>
            <Router>
              <Routes>
                <Route path="/" element={<ExchangeLayout />} />
                <Route path="/reset-password" element={<ResetPasswordForm />} />
              </Routes>
            </Router>
          </PositionProvider>
        </TokenProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;