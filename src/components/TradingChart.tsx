import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { binanceWS } from '../services/binanceWebSocket';
import { useToken } from '../context/TokenContext';

const TIMEFRAMES = [
  { label: '1m', value: '1m', minutes: 1 },
  { label: '5m', value: '5m', minutes: 5 },
  { label: '15m', value: '15m', minutes: 15 },
  { label: '1h', value: '1h', minutes: 60 },
  { label: '4h', value: '4h', minutes: 240 },
  { label: '1d', value: '1d', minutes: 1440 },
  { label: '1w', value: '1w', minutes: 10080 }
];

const TradingChart: React.FC = () => {
  const { selectedToken } = useToken();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: 350,
      height: 250,
      layout: {
        background: { type: ColorType.Solid, color: '#1E293B' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: '#2D3748' },
        horzLines: { color: '#2D3748' },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: '#4B5563',
          labelBackgroundColor: '#4B5563',
        },
        horzLine: {
          color: '#4B5563',
          labelBackgroundColor: '#4B5563',
        },
      },
      rightPriceScale: {
        borderColor: '#2D3748',
      },
      timeScale: {
        borderColor: '#2D3748',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22C55E',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#22C55E',
      wickDownColor: '#EF4444',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    // Handle resize
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
  }, []);

  // Fetch historical data when token or timeframe changes
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${selectedToken}&interval=${selectedTimeframe}&limit=100`
        );
        const data = await response.json();
        
        if (candleSeriesRef.current) {
          const candleData = data.map((d: any) => ({
            time: d[0] / 1000,
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
          }));
          candleSeriesRef.current.setData(candleData);
        }
      } catch (error) {
        console.error('Failed to fetch historical data:', error);
      }
    };

    fetchHistoricalData();
  }, [selectedToken, selectedTimeframe]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = binanceWS.onPriceUpdate((data) => {
      const tokenData = data.find(token => token.symbol === selectedToken);
      if (tokenData && candleSeriesRef.current) {
        candleSeriesRef.current.update({
          time: Math.floor(Date.now() / 1000),
          open: tokenData.price,
          high: tokenData.price,
          low: tokenData.price,
          close: tokenData.price,
        });
      }
    });

    return () => unsubscribe();
  }, [selectedToken]);

  return (
    <div className="bg-[#1E293B] rounded-lg overflow-hidden">
      <div className="p-2 border-b border-gray-700 flex items-center justify-end space-x-2">
        {TIMEFRAMES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setSelectedTimeframe(value)}
            className={`px-3 py-1 rounded text-sm ${
              selectedTimeframe === value
                ? 'bg-[#22C55E] text-white'
                : 'text-gray-400 hover:bg-[#2D3748]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div ref={chartContainerRef} />
    </div>
  );
};

export default TradingChart;