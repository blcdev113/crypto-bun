import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { binanceWS, OrderBookEntry } from '../services/binanceWebSocket';
import { useToken } from '../context/TokenContext';

const OrderBook: React.FC = () => {
  const { selectedToken } = useToken();
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [decimals, setDecimals] = useState(2);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  
  useEffect(() => {
    const unsubscribe = binanceWS.onOrderBookUpdate((data) => {
      if (data.symbol === selectedToken) {
        const now = Date.now();
        // Only update if 500ms have passed since last update
        if (now - lastUpdateTime >= 500) {
          setBids(data.bids.slice(0, 6));
          setAsks(data.asks.slice(0, 6));
          setLastUpdateTime(now);
        }
      }
    });
    
    return () => unsubscribe();
  }, [selectedToken, lastUpdateTime]);

  // Auto-hide after 5 seconds of inactivity
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  return (
    <div className="h-full w-full flex flex-col bg-[#0F172A] text-xs font-mono">
      <button 
        className="p-3 border-b border-gray-800 flex items-center justify-between hover:bg-gray-800 transition-colors w-full"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-gray-400">Order Book</span>
        <div className="flex items-center">
          <span className="text-xs text-gray-400 mr-2">{selectedToken}</span>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>
      
      <div className={`flex-1 overflow-hidden transition-all duration-300 ${isExpanded ? 'h-auto' : 'h-0'}`}>
        <div className="grid grid-cols-2 py-2 text-gray-500 text-[11px] px-3">
          <div>Price (USDT)</div>
          <div className="text-right">Total (BTC)</div>
        </div>

        {/* Sell orders (asks) */}
        <div className="flex-1">
          {asks.slice().reverse().map((order, i) => (
            <div key={`ask-${i}`} className="relative">
              <div 
                className="absolute inset-y-0 right-0 bg-[#3D1C1C] z-0"
                style={{ width: `${order.depth * 100}%` }}
              />
              <div className="grid grid-cols-2 py-1 px-3 relative z-10">
                <div className="text-[#FF5370]">{order.price.toFixed(1)}</div>
                <div className="text-right text-gray-300">{order.total.toFixed(3)}</div>
              </div>
            </div>
          ))}
          
          {/* Market Price */}
          <div className="grid grid-cols-2 py-1.5 px-3 bg-gray-800 bg-opacity-40 text-[11px]">
            <div className="text-gray-400">Mark {bids[0]?.price.toFixed(2)}</div>
            <div className="text-right">
              <span className="text-[#4CAF50]">Long 57%</span>
              <span className="text-gray-400 mx-1">|</span>
              <span className="text-[#FF5370]">43% Short</span>
            </div>
          </div>
        </div>
        
        {/* Buy orders (bids) */}
        <div className="flex-1">
          {bids.map((order, i) => (
            <div key={`bid-${i}`} className="relative">
              <div 
                className="absolute inset-y-0 right-0 bg-[#1C3D26] z-0"
                style={{ width: `${order.depth * 100}%` }}
              />
              <div className="grid grid-cols-2 py-1 px-3 relative z-10">
                <div className="text-[#4CAF50]">{order.price.toFixed(1)}</div>
                <div className="text-right text-gray-300">{order.total.toFixed(3)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;