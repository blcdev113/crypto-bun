import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { Moon, Sun, Zap, LogOut, ChevronDown, TrendingUp, ArrowLeftRight, BarChart2, Wallet, HelpCircle, Bell, Download, Globe } from 'lucide-react';
import AuthModal from './AuthModal';
import ConvertModal from './ConvertModal';
import { usePositions } from '../context/PositionContext';
import { binanceWS } from '../services/binanceWebSocket';
import QRCode from 'qrcode.react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useUser();
  const { tokenBalances } = usePositions();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showFeaturesDropdown, setShowFeaturesDropdown] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [prices, setPrices] = useState<any[]>([]);
  const [showDownloadQR, setShowDownloadQR] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' }
  ];

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
    onTabChange('futures');
  };

  const handleConvertClick = () => {
    setShowFeaturesDropdown(false);
    setShowConvertModal(true);
  };

  return (
    <header className="bg-[#0F172A] text-white py-4 px-6 flex items-center justify-between border-b border-gray-800 relative">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => onTabChange('home')}
          className="flex items-center space-x-2 hover:bg-[#1E293B] p-2 rounded-lg transition-colors"
        >
          <Zap className="w-8 h-8 text-[#22C55E]" />
          <h1 className="text-2xl font-bold">TX</h1>
        </button>
        
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

        {/* Navigation Items */}
        <nav className="flex items-center space-x-1">
          <button
            onClick={() => onTabChange('markets')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'markets' 
                ? 'bg-[#22C55E] text-white' 
                : 'hover:bg-[#1E293B] text-gray-300'
            }`}
          >
            <BarChart2 size={16} />
            <span className="text-sm font-medium">Markets</span>
          </button>
          <button
            onClick={() => onTabChange('portfolio')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'portfolio' 
                ? 'bg-[#22C55E] text-white' 
                : 'hover:bg-[#1E293B] text-gray-300'
            }`}
          >
            <Wallet size={16} />
            <span className="text-sm font-medium">Assets</span>
          </button>
          <button
            onClick={() => onTabChange('support')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'support' 
                ? 'bg-[#22C55E] text-white' 
                : 'hover:bg-[#1E293B] text-gray-300'
            }`}
          >
            <HelpCircle size={16} />
            <span className="text-sm font-medium">Support Center</span>
          </button>
          <button
            onClick={() => onTabChange('announcements')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'announcements' 
                ? 'bg-[#22C55E] text-white' 
                : 'hover:bg-[#1E293B] text-gray-300'
            }`}
          >
            <Bell size={16} />
            <span className="text-sm font-medium">Announcements</span>
          </button>
        </nav>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Download with QR Code */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowDownloadQR(true)}
            onMouseLeave={() => setShowDownloadQR(false)}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <Download size={18} />
            <span className="text-sm">Download</span>
          </button>
          
          {showDownloadQR && (
            <div className="absolute top-full right-0 mt-2 bg-[#1E293B] rounded-lg shadow-lg border border-gray-700 p-4 z-50">
              <div className="text-center">
                <div className="mb-2">
                  <QRCode 
                    value="https://cryptox.exchange/download" 
                    size={120}
                    level="H"
                    className="mx-auto"
                  />
                </div>
                <p className="text-xs text-gray-400">Scan to download mobile app</p>
              </div>
            </div>
          )}
        </div>

        {/* Auth Buttons or User Info */}
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

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <Globe size={18} />
            <span className="text-sm">{selectedLanguage}</span>
            <ChevronDown size={14} className={`transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showLanguageDropdown && (
            <div className="absolute top-full right-0 mt-2 w-40 bg-[#1E293B] rounded-lg shadow-lg border border-gray-700 z-50 max-h-60 overflow-y-auto">
              <div className="py-2">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => {
                      setSelectedLanguage(language.name);
                      setShowLanguageDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-[#2D3748] transition-colors text-sm ${
                      selectedLanguage === language.name ? 'text-[#22C55E]' : 'text-gray-300'
                    }`}
                  >
                    {language.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
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

      {/* Click outside to close language dropdown */}
      {showLanguageDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowLanguageDropdown(false)}
        />
      )}
    </header>
  );
};

export default Header;