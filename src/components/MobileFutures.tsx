import React, { useState, useEffect } from 'react';
import { Menu, Info, TrendingDown, TrendingUp } from 'lucide-react';
import { binanceWS, TokenPrice } from '../services/binanceWebSocket';
import { formatCurrency } from '../utils/formatters';
import { useToken } from '../context/TokenContext';
import { usePositions } from '../context/PositionContext';
import { createChart } from 'lightweight-charts';

const TIME_OPTIONS = [
  { label: '60s', value: 60 },
  { label: '120s', value: 120 },
  { label: '5min', value: 300 },
  { label: '10min', value: 600 }
];

const MobileFutures: React.FC = () => {
  const { selectedToken } = useToken();
  const { portfolioBalance } = usePositions();
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [selectedTime, setSelectedTime] = useState(60);
  const [countdown, setCountdown] = useState(44);
  const [orderDeadline, setOrderDeadline] = useState('2025/8/13 15:16:00');
  const [timePeriod, setTimePeriod] = useState('15:16-15:17');
  const [callPercentage] = useState(55.56);
  const [putPercentage] = useState(57.44);
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<any>(null);

  useEffect(() => {
    const unsubscribe = binanceWS.onPriceUpdate((data) => {
      const tokenData = data.find(token => token.symbol === selectedToken);
      if (tokenData) {
        setCurrentPrice(tokenData.price);
        setPriceChange(tokenData.priceChange);
      }
    });
    return () => unsubscribe();
  }, [selectedToken]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => prev > 0 ? prev - 1 : 44);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: "#0b0f19" },
        textColor: "#d1d4dc",
      },
      grid: {
        vertLines: { color: "#1f2733" },
        horzLines: { color: "#1f2733" },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: "#485c7b",
      },
      timeScale: {
        borderColor: "#485c7b",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#4bffb5",
      downColor: "#ff4976",
      borderUpColor: "#4bffb5",
      borderDownColor: "#ff4976",
      wickUpColor: "#4bffb5",
      wickDownColor: "#ff4976",
    });

    // Volume series
    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: "",
      scaleMargins: { top: 0.7, bottom: 0 },
    });

    chartRef.current = chart;

    // Fetch and set data
    const fetchData = async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${selectedToken}&interval=1m&limit=100`
        );
        const data = await response.json();
        
        if (Array.isArray(data)) {
          const candleData = data.map((kline: any[]) => ({
            time: Math.floor(kline[0] / 1000),
            open: parseFloat(kline[1]),
            high: parseFloat(kline[2]),
            low: parseFloat(kline[3]),
            close: parseFloat(kline[4]),
          }));

          const volumeData = data.map((kline: any[]) => ({
            time: Math.floor(kline[0] / 1000),
            value: parseFloat(kline[5]) / 1000,
            color: parseFloat(kline[4]) >= parseFloat(kline[1]) ? "#4bffb5" : "#ff4976"
          }));

          candleSeries.setData(candleData);
          volumeSeries.setData(volumeData);
          chart.timeScale().fitContent();
        }
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      }
    };

    fetchData();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [selectedToken]);

  const getTokenSymbol = () => selectedToken.replace('USDT', '');

  return (
    <div className="bg-[#0F172A] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center">
          <Menu size={20} className="mr-3" />
          <div>
            <span className="font-semibold">{getTokenSymbol()} / USDT</span>
            <span className={`ml-2 text-sm ${priceChange >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <Info size={20} className="mr-3 text-gray-400" />
          <div className="flex items-center">
            <span className="text-sm mr-1">Trend</span>
            <TrendingDown size={16} className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Time Selection */}
      <div className="p-4">
        <div className="flex space-x-2 mb-4">
          {TIME_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedTime(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTime === option.value
                  ? 'bg-[#22C55E] text-black'
                  : 'bg-[#2D3748] text-gray-300 hover:bg-[#374151]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div>
            <div className="text-gray-400 mb-1">Order deadline(UTC+3)</div>
            <div className="text-white">{orderDeadline}</div>
          </div>
          <div className="text-center">
            <div className="text-[#22C55E] mb-1">Countdown</div>
            <div className="text-[#22C55E] text-lg font-bold">{countdown} s</div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 mb-1">Time Period</div>
            <div className="text-white">{timePeriod}</div>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-4">
            <button className="text-gray-400 text-sm">Line ▼</button>
            <button className="text-gray-400 text-sm">VOL ▼</button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 mb-4">
        <div ref={chartContainerRef} className="w-full h-[300px] bg-[#0b0f19] rounded-lg" />
      </div>

      {/* Position Order Tabs */}
      <div className="px-4 mb-4">
        <div className="flex space-x-6 border-b border-gray-700">
          <button className="pb-2 text-sm font-medium text-[#22C55E] border-b-2 border-[#22C55E]">
            Position order
          </button>
          <button className="pb-2 text-sm font-medium text-gray-400">
            Historical orders
          </button>
          <button className="pb-2 text-sm font-medium text-gray-400">
            Invited me
          </button>
          <button className="pb-2 text-sm font-medium text-gray-400">
            Follow
          </button>
        </div>
      </div>

      {/* Call/Put Buttons */}
      <div className="px-4 pb-20">
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-[#22C55E] hover:bg-[#16A34A] text-white py-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center">
            <TrendingUp className="mr-2" size={20} />
            <div>
              <div className="text-lg font-bold">CALL</div>
              <div className="text-sm opacity-90">{callPercentage}%</div>
            </div>
          </button>
          
          <button className="bg-[#EF4444] hover:bg-[#DC2626] text-white py-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center">
            <TrendingDown className="mr-2" size={20} />
            <div>
              <div className="text-lg font-bold">PUT</div>
              <div className="text-sm opacity-90">{putPercentage}%</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileFutures;