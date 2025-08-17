import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { 
  User, 
  Copy, 
  Wallet, 
  Share2, 
  History, 
  RefreshCw, 
  Shield, 
  ChevronDown,
  Trash2,
  LogOut,
  CheckCircle
} from 'lucide-react';

const AccountDropdown: React.FC = () => {
  const { user, signOut } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate a mock user ID for display
  const userId = user ? `9HDDRD0RS000` : '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!user) return null;

  const menuItems = [
    {
      icon: Wallet,
      label: 'Asset Wallets',
      onClick: () => console.log('Asset Wallets clicked'),
      disabled: false
    },
    {
      icon: Share2,
      label: 'Share With Friends',
      onClick: () => console.log('Share With Friends clicked'),
      disabled: false
    },
    {
      icon: History,
      label: 'Transaction History',
      onClick: () => console.log('Transaction History clicked'),
      disabled: false
    },
    {
      icon: RefreshCw,
      label: 'Convert record',
      onClick: () => console.log('Convert record clicked'),
      disabled: false
    },
    {
      icon: CheckCircle,
      label: 'Verification',
      onClick: () => console.log('Verification clicked'),
      disabled: false
    },
    {
      icon: Shield,
      label: 'Security',
      onClick: () => console.log('Security clicked'),
      disabled: false,
      hasSubmenu: true,
    },
    {
      icon: Trash2,
      label: 'Clear cache',
      onClick: () => console.log('Clear cache clicked'),
      disabled: false
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-[#2D3748] hover:bg-[#374151] px-4 py-2 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center">
          <User size={18} className="text-white" />
        </div>
        <span className="text-sm">Account</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-[#1E293B] rounded-lg shadow-xl border border-gray-700 z-50">
          {/* User Info Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-[#22C55E] flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium truncate">
                  {user.email}
                </div>
                {userId && (
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-gray-400">ID:</span>
                    <span className="text-sm text-white font-mono">{userId}</span>
                    <button
                      onClick={handleCopyId}
                      className="text-[#22C55E] hover:text-[#16A34A] transition-colors"
                    >
                      {copiedId ? (
                        <CheckCircle size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-1 rounded text-xs font-bold">
                VIP0
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                disabled={item.disabled}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#2D3748] transition-colors ${
                  item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon size={18} className="text-gray-400" />
                  <span className="text-white">{item.label}</span>
                </div>
                {item.hasSubmenu && (
                  <ChevronDown size={16} className="text-gray-400 -rotate-90" />
                )}
              </button>
            ))}
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
  );
};

export default AccountDropdown;