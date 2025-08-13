import React from 'react';
import Header from '../components/Header';
import MarketTickers from '../components/MarketTickers';
import TradingSection from '../components/TradingSection';
import Portfolio from '../components/Portfolio';
import MobileHome from '../components/MobileHome';
import MobileFutures from '../components/MobileFutures';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { HelpCircle, Bell, Home, TrendingUp, BarChart3, Wallet, Grid3X3 } from 'lucide-react';
import AuthModal from '../components/AuthModal';

const ExchangeLayout: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const [activeTab, setActiveTab] = React.useState('home');
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  // Mobile-first navigation items
  const mobileNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'markets', label: 'Markets', icon: TrendingUp },
    { id: 'futures', label: 'Futures', icon: BarChart3 },
    { id: 'perpetual', label: 'Perpetual', icon: Grid3X3 },
    { id: 'portfolio', label: 'Assets', icon: Wallet }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="block md:hidden">
            <MobileHome onNavigateToFutures={() => handleTabClick('futures')} />
          </div>
        );
      case 'markets':
        return <MarketTickers onNavigateToFutures={() => handleTabClick('futures')} />;
      case 'futures':
        return (
          <div className="block md:hidden">
            <MobileFutures />
          </div>
        );
      case 'perpetual':
        return (
          <div className="block md:hidden">
            <MobileFutures />
          </div>
        );
      case 'portfolio':
        return <Portfolio />;
      case 'support':
        return (
          <div className="px-4 py-6">
            <div className="bg-[#1E293B] rounded-lg p-6">
              <div className="text-center">
                <HelpCircle size={48} className="text-[#22C55E] mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-4">Support Center</h2>
                <p className="text-gray-400 mb-6">
                  Get help with your trading questions and technical issues
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#2D3748] p-4 rounded-lg">
                    <h3 className="font-medium mb-2">FAQ</h3>
                    <p className="text-sm text-gray-400">Find answers to common questions</p>
                  </div>
                  <div className="bg-[#2D3748] p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Live Chat</h3>
                    <p className="text-sm text-gray-400">Chat with our support team</p>
                  </div>
                  <div className="bg-[#2D3748] p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Trading Guide</h3>
                    <p className="text-sm text-gray-400">Learn how to trade effectively</p>
                  </div>
                  <div className="bg-[#2D3748] p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Contact Us</h3>
                    <p className="text-sm text-gray-400">Reach out via email or phone</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'announcements':
        return (
          <div className="px-4 py-6">
            <div className="bg-[#1E293B] rounded-lg p-6">
              <div className="flex items-center mb-6">
                <Bell size={24} className="text-[#22C55E] mr-3" />
                <h2 className="text-2xl font-semibold">Announcements</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-[#2D3748] p-4 rounded-lg border-l-4 border-[#22C55E]">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">New Trading Pairs Added</h3>
                    <span className="text-xs text-gray-400">2 hours ago</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    We've added support for 5 new trading pairs including SOL/USDT and MATIC/USDT
                  </p>
                </div>
                <div className="bg-[#2D3748] p-4 rounded-lg border-l-4 border-[#3B82F6]">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">System Maintenance Complete</h3>
                    <span className="text-xs text-gray-400">1 day ago</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Scheduled maintenance has been completed. All systems are now operational.
                  </p>
                </div>
                <div className="bg-[#2D3748] p-4 rounded-lg border-l-4 border-[#F59E0B]">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">Trading Competition</h3>
                    <span className="text-xs text-gray-400">3 days ago</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Join our monthly trading competition with prizes up to $10,000 USDT!
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A] text-white overflow-x-hidden">
      {/* Desktop Header - Hidden on mobile */}
      <div className="hidden md:block">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
      {/* Mobile Content */}
      <main className="flex-1 overflow-auto min-h-0 pb-16 md:pb-0">
        {renderContent()}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1E293B] border-t border-gray-800 md:hidden z-50">
        <div className="flex items-center justify-around py-2">
          {mobileNavItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabClick(id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeTab === id 
                  ? 'text-[#22C55E]' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs mt-1">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </div>
  );
};

export default ExchangeLayout;