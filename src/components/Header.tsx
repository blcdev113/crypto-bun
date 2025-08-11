import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { Moon, Sun, Zap, LogOut } from 'lucide-react';
import AuthModal from './AuthModal';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-[#0F172A] text-white py-4 px-6 flex items-center justify-between border-b border-gray-800">
      <div className="flex items-center space-x-2">
        <Zap className="w-8 h-8 text-[#22C55E]" />
        <h1 className="text-2xl font-bold">TX</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {user ? (
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
    </header>
  );
};

export default Header;