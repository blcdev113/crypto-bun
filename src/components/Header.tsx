import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { Moon, Sun, Zap, LogOut, Download, ChevronDown, Globe } from 'lucide-react';
import AuthModal from './AuthModal';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' }
];

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

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
            <span className="text-sm text-gray-400">Welcome, {user.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 bg-[#2D3748] hover:bg-[#374151] px-4 py-2 rounded-lg"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
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
            <span className="text-lg">{selectedLanguage.flag}</span>
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
                    <span className="text-lg">{language.flag}</span>
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

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </header>
  );
};

export default Header;