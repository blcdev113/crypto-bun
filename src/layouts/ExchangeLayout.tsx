import React from 'react';
import Header from '../components/Header';
import MarketTickers from '../components/MarketTickers';
import TokenList from '../components/TokenList';
import TradingChart from '../components/TradingChart';
import OrderBook from '../components/OrderBook';
import TradingSection from '../components/TradingSection';
import Portfolio from '../components/Portfolio';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { HelpCircle, Bell } from 'lucide-react';
import { useToken } from '../context/TokenContext';
import { cryptoLogos } from '../utils/cryptoLogos';
import AuthModal from '../components/AuthModal';

const ExchangeLayout: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const [activeTab, setActiveTab] = React.useState('home');
  const { selectedToken, setSelectedToken } = useToken();
  const [showTokenList, setShowTokenList] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  const getTokenSymbol = (symbol: string) => symbol.replace('USDT', '');
  const symbol = getTokenSymbol(selectedToken);
  const logo = cryptoLogos[symbol];

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <MarketTickers onNavigateToFutures={() => handleTabClick('futures')} />;
      case 'markets':
        return (
          <div className="px-2 py-2">
            <div className="bg-[#1E293B] rounded-lg p-4 relative mb-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowTokenList(!showTokenList)}
              >
                <div className="flex items-center">
                  {logo ? (
                    <img src={logo} alt={symbol} className="w-8 h-8 rounded-full mr-3" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white mr-3">
                      {symbol.substring(0, 1)}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">{symbol}/USDT</div>
                    <div className="text-sm text-gray-400">Spot Trading</div>
                  </div>
                </div>
              </div>

              {showTokenList && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E293B] rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  <TokenList onSelect={(token) => {
                    setSelectedToken(token);
                    setShowTokenList(false);
                  }} />
                </div>
              )}
            </div>
            <TradingChart />
            <OrderBook />
          </div>
        );
      case 'futures':
        return (
          <div className="px-2 py-2">
            <TradingSection />
          </div>
        );
      case 'portfolio':
        return (
          <div className="px-2 py-2">
            <Portfolio />
          </div>
        );
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
    <div className={`min-h-screen flex flex-col bg-[#0F172A] text-white overflow-x-hidden`}>
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 overflow-auto min-h-0">
        {renderContent()}
      </main>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </div>
  );
};

export default ExchangeLayout;