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
import { BarChart2, Home, LineChart, Wallet, Mail } from 'lucide-react';
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

  // Listen for navigation events from header
  React.useEffect(() => {
    const handleNavigateToFutures = () => {
      setActiveTab('futures');
    };

    window.addEventListener('navigateToFutures', handleNavigateToFutures);
    return () => window.removeEventListener('navigateToFutures', handleNavigateToFutures);
  }, []);

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
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#0F172A] text-white`}>
      <Header />
      
      <main className="flex-1 overflow-auto pb-20">
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#1E293B] border-t border-gray-800">
        <div className="flex justify-between items-center h-16 px-4">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center ${activeTab === 'home' ? 'text-[#22C55E]' : 'text-gray-400'}`}
          >
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('markets')}
            className={`flex flex-col items-center justify-center ${activeTab === 'markets' ? 'text-[#22C55E]' : 'text-gray-400'}`}
          >
            <BarChart2 size={20} />
            <span className="text-xs mt-1">Markets</span>
          </button>
          <button
            onClick={() => setActiveTab('futures')}
            className={`flex flex-col items-center justify-center ${activeTab === 'futures' ? 'text-[#22C55E]' : 'text-gray-400'}`}
          >
            <LineChart size={20} />
            <span className="text-xs mt-1">Futures</span>
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex flex-col items-center justify-center ${activeTab === 'portfolio' ? 'text-[#22C55E]' : 'text-gray-400'}`}
          >
            <Wallet size={20} />
            <span className="text-xs mt-1">Assets</span>
          </button>
        </div>
      </nav>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </div>
  );
};

export default ExchangeLayout;