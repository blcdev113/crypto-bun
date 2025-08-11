import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { Moon, Sun, Zap, LogOut, ChevronDown, TrendingUp, ArrowLeftRight } from 'lucide-react';
import AuthModal from './AuthModal';
import ConvertModal from './ConvertModal';
import { usePositions } from '../context/PositionContext';
import { binanceWS } from '../services/binanceWebSocket';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useUser();
  const { tokenBalances } = usePositions();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showFeaturesDropdown, setShowFeaturesDropdown] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [prices, setPrices] = useState<any[]>([]);

  React.useEffect(() => {
    const unsubscribe = binanceWS.onPriceUpdate((data) => {
      setPrices(data);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handlePerpetualClick = () => {
    setShowFeaturesDropdown(false);
    // Navigate to futures tab - we'll need to communicate with the layout
    window.dispatchEvent(new CustomEvent('navigateToFutures'));
  };

  const handleConvertClick = () => {
    setShowFeaturesDropdown(false);
    setShowConvertModal(true);
  };

  return (
    <header className="bg-[#0F172A] text-white py-4 px-6 flex items-center justify-between border-b border-gray-800 relative">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-8 h-8 text-[#22C55E]" />
          <h1 className="text-2xl font-bold">TX</h1>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowFeaturesDropdown(!showFeaturesDropdown)}
            className="flex items-center space-x-2 bg-[#1E293B] hover:bg-[#2D3748] px-4 py-2 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium">Features</span>
            <ChevronDown size={16} className={`transition-transform ${showFeaturesDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showFeaturesDropdown && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-[#1E293B] rounded-lg shadow-lg border border-gray-700 z-50">
              <div className="py-2">
                <button
                  onClick={handlePerpetualClick}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-[#2D3748] transition-colors text-left"
                >
                  <TrendingUp size={18} className="text-[#22C55E]" />
                  <div>
                    <div className="font-medium">Perpetual</div>
                    <div className="text-xs text-gray-400">Trade with leverage</div>
                  </div>
                </button>
                <button
                  onClick={handleConvertClick}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-[#2D3748] transition-colors text-left"
                >
                  <ArrowLeftRight size={18} className="text-[#3B82F6]" />
                  <div>
                    <div className="font-medium">Convert</div>
                    <div className="text-xs text-gray-400">Exchange tokens</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {user && user.email !== 'demo@cryptox.com' ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Welcome, {user.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-[#2D3748] hover:bg-[#374151] px-4 py-2 rounded-lg"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400 bg-[#2D3748] px-3 py-1 rounded-lg">
              Demo Mode - Explore freely!
            </span>
            <button 
              className="bg-[#2D3748] hover:bg-[#374151] text-white px-4 py-2 rounded-lg transition-all duration-200"
              onClick={() => {
                setAuthMode('login');
                setShowAuthModal(true);
              }}
            >
              Login
            </button>
            <button 
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-4 py-2 rounded-lg transition-all duration-200"
              onClick={() => {
                setAuthMode('register');
                setShowAuthModal(true);
              }}
            >
              Register
            </button>
          </div>
        )}
        
        <button 
          onClick={toggleTheme} 
          className="p-1.5 rounded-full hover:bg-gray-800 transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      <ConvertModal 
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        prices={prices}
        tokenBalances={tokenBalances}
      />

      {/* Click outside to close dropdown */}
      {showFeaturesDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowFeaturesDropdown(false)}
        />
      )}
    </header>
  );
};

export default Header;