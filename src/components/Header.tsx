import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { Moon, Sun, Zap, LogOut, Download, ChevronDown, Globe, User, Copy, Wallet, Share2, History, FileText, Shield, Trash2 } from 'lucide-react';
import AuthModal from './AuthModal';
import AssetWalletsModal from './AssetWalletsModal';
import ShareWithFriendsModal from './ShareWithFriendsModal';
import ConvertRecordModal from './ConvertRecordModal';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: 'https://flagcdn.com/w20/us.png', country: 'US' },
  { code: 'es', name: 'Español', flag: 'https://flagcdn.com/w20/es.png', country: 'ES' },
  { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/w20/fr.png', country: 'FR' },
  { code: 'de', name: 'Deutsch', flag: 'https://flagcdn.com/w20/de.png', country: 'DE' },
  { code: 'it', name: 'Italiano', flag: 'https://flagcdn.com/w20/it.png', country: 'IT' },
  { code: 'pt', name: 'Português', flag: 'https://flagcdn.com/w20/pt.png', country: 'PT' },
  { code: 'ru', name: 'Русский', flag: 'https://flagcdn.com/w20/ru.png', country: 'RU' },
  { code: 'zh', name: '中文', flag: 'https://flagcdn.com/w20/cn.png', country: 'CN' },
  { code: 'ja', name: '日本語', flag: 'https://flagcdn.com/w20/jp.png', country: 'JP' },
  { code: 'ko', name: '한국어', flag: 'https://flagcdn.com/w20/kr.png', country: 'KR' }
];

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showAssetWalletsModal, setShowAssetWalletsModal] = useState(false);
  const [showShareWithFriendsModal, setShowShareWithFriendsModal] = useState(false);
  const [showConvertRecordModal, setShowConvertRecordModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleLanguageSelect = (language: typeof LANGUAGES[0]) => {
    setSelectedLanguage(language);
    setShowLanguageDropdown(false);
  };

  return (
    <header className="bg-[#0F172A] text-white py-4 px-6 flex items-center justify-between border-b border-gray-800">
      {/* Left side - Logo and Navigation */}
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2">
          <Zap className="w-8 h-8 text-[#22C55E]" />
          <h1 className="text-2xl font-bold">TX</h1>
        </div>
        
        {/* Navigation Menu */}
        <nav className="hidden md:flex items-center space-x-6">
          <div className="flex items-center space-x-1 text-gray-300 hover:text-white cursor-pointer">
            <span>Futures</span>
            <ChevronDown size={16} />
          </div>
          <span className="text-gray-300 hover:text-white cursor-pointer">Markets</span>
          <span className="text-gray-300 hover:text-white cursor-pointer">Assets</span>
          <span className="text-gray-300 hover:text-white cursor-pointer">Support center</span>
          <span className="text-gray-300 hover:text-white cursor-pointer">Announcements</span>
        </nav>
      </div>
      
      {/* Right side - Actions */}
      <div className="flex items-center space-x-4">
        {user ? (
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2 bg-[#2D3748] hover:bg-[#374151] px-4 py-2 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <span className="text-sm text-gray-300">Account</span>
                <ChevronDown size={16} className="text-gray-400" />
              </button>
              
              {showUserDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-[#1E293B] rounded-lg shadow-lg border border-gray-700 min-w-[280px] z-50">
                  {/* User Info Header */}
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-[#22C55E] flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.email}</div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-0.5 rounded text-xs font-bold">
                            VIP0
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <span>ID: 9HDDRD0RS000</span>
                      <button className="text-gray-400 hover:text-white">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-[#2D3748] transition-colors text-gray-300 hover:text-white">
                      <Wallet size={18} />
                      <span onClick={() => {
                        setShowAssetWalletsModal(true);
                        setShowUserDropdown(false);
                      }}>Asset Wallets</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setShowShareWithFriendsModal(true);
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-[#2D3748] transition-colors text-gray-300 hover:text-white"
                    >
                      <Share2 size={18} />
                      <span>Share With Friends</span>
                    </button>
                    
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-[#2D3748] transition-colors text-gray-300 hover:text-white">
                      <History size={18} />
                      <span>Transaction History</span>
                    </button>
                    
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-[#2D3748] transition-colors text-gray-300 hover:text-white">
                      <FileText size={18} />
                      <span onClick={() => {
                        setShowConvertRecordModal(true);
                        setShowUserDropdown(false);
                      }}>Convert record</span>
                    </button>
                    
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-[#2D3748] transition-colors text-gray-300 hover:text-white">
                      <Shield size={18} />
                      <span>Verification</span>
                    </button>
                    
                    <div className="relative">
                      <button className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#2D3748] transition-colors text-gray-300 hover:text-white">
                        <div className="flex items-center space-x-3">
                          <Shield size={18} />
                          <span>Security</span>
                        </div>
                        <ChevronDown size={16} />
                      </button>
                    </div>
                    
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-[#2D3748] transition-colors text-gray-300 hover:text-white">
                      <Trash2 size={18} />
                      <span>Clear cache</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-700 py-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-[#2D3748] transition-colors text-red-400 hover:text-red-300"
                    >
                      <LogOut size={18} />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Download Button */}
            <button className="flex items-center space-x-2 text-gray-300 hover:text-white">
              <Download size={18} />
              <span className="hidden sm:inline">Download</span>
            </button>
            
            {/* Login Button */}
            <button 
              className="text-gray-300 hover:text-white px-4 py-2 transition-all duration-200"
              onClick={() => {
                setAuthMode('login');
                setShowAuthModal(true);
              }}
            >
              Login
            </button>
            
            {/* Register Button */}
            <button 
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-4 py-2 rounded-lg transition-all duration-200"
              onClick={() => {
                setAuthMode('register');
                setShowAuthModal(true);
              }}
            >
              Register
            </button>
          </>
        )}
        
        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="flex items-center space-x-2 text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-[#1E293B] transition-colors"
          >
            <img 
              src={selectedLanguage.flag} 
              alt={selectedLanguage.country}
              className="w-5 h-4 rounded-sm"
            />
            <span className="hidden sm:inline">{selectedLanguage.name}</span>
            <ChevronDown size={16} />
          </button>
          
          {showLanguageDropdown && (
            <div className="absolute right-0 top-full mt-2 bg-[#1E293B] rounded-lg shadow-lg border border-gray-700 min-w-[200px] z-50">
              <div className="py-2">
                {LANGUAGES.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageSelect(language)}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-[#2D3748] transition-colors ${
                      selectedLanguage.code === language.code ? 'bg-[#2D3748] text-[#22C55E]' : 'text-gray-300'
                    }`}
                  >
                    <img 
                      src={language.flag} 
                      alt={language.country}
                      className="w-5 h-4 rounded-sm"
                    />
                    <span>{language.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme} 
          className="p-1.5 rounded-full hover:bg-gray-800 transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Click outside to close language dropdown */}
      {showLanguageDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowLanguageDropdown(false)}
        />
      )}

      {/* Click outside to close user dropdown */}
      {showUserDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserDropdown(false)}
        />
      )}

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      <AssetWalletsModal 
        isOpen={showAssetWalletsModal}
        onClose={() => setShowAssetWalletsModal(false)}
      />

      <ShareWithFriendsModal 
        isOpen={showShareWithFriendsModal}
        onClose={() => setShowShareWithFriendsModal(false)}
      />

      <ConvertRecordModal 
        isOpen={showConvertRecordModal}
        onClose={() => setShowConvertRecordModal(false)}
      />
    </header>
  );
};

export default Header;