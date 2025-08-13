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
  const volumeSeriesRef = useRef<any>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with dark theme
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
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

    // Add candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#4bffb5",
      downColor: "#ff4976",
      borderUpColor: "#4bffb5",
      borderDownColor: "#ff4976",
      wickUpColor: "#4bffb5",
      wickDownColor: "#ff4976",
    });

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: "",
      scaleMargins: { top: 0.7, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

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
        
        if (candleSeriesRef.current && volumeSeriesRef.current && Array.isArray(data)) {
          // Clear existing data
          candleSeriesRef.current.setData([]);
          volumeSeriesRef.current.setData([]);

          // Process candlestick data
          const candleData = data.map((kline: any[]) => {
            const [timestamp, open, high, low, close] = kline;
            return {
              time: Math.floor(timestamp / 1000), // Convert to seconds
              open: parseFloat(open),
              high: parseFloat(high),
              low: parseFloat(low),
              close: parseFloat(close),
            };
          });

          // Process volume data
          const volumeData = data.map((kline: any[]) => {
            const [timestamp, open, high, low, close, volume] = kline;
            const openPrice = parseFloat(open);
            const closePrice = parseFloat(close);
            const isUp = closePrice >= openPrice;
            
            return {
              time: Math.floor(timestamp / 1000), // Convert to seconds
              value: parseFloat(volume) / 1000, // Scale down volume for better display
              color: isUp ? "#4bffb5" : "#ff4976"
            };
          });

          // Set the data
          candleSeriesRef.current.setData(candleData);
          volumeSeriesRef.current.setData(volumeData);

          // Fit content to show all data
          chart.timeScale().fitContent();
        }
      } catch (error) {
        console.error('Failed to fetch historical data:', error);
      }
    };

    if (selectedToken && selectedTimeframe) {
      fetchHistoricalData();
    }
  }, [selectedToken, selectedTimeframe]);

  // Subscribe to real-time updates (throttled)
  useEffect(() => {
    const unsubscribe = binanceWS.onPriceUpdate((data) => {
      const tokenData = data.find(token => token.symbol === selectedToken);
      if (tokenData && candleSeriesRef.current && volumeSeriesRef.current) {
        const now = Date.now();
        
        // Throttle updates to every 5 seconds to avoid overwhelming the chart
        if (now - lastUpdateTime < 5000) return;
        setLastUpdateTime(now);

        const currentTime = Math.floor(now / 1000);
        
        // Update the last candlestick with current price
        candleSeriesRef.current.update({
          time: currentTime,
          open: tokenData.price,
          high: tokenData.price,
          low: tokenData.price,
          close: tokenData.price,
        });

        // Update volume
        volumeSeriesRef.current.update({
          time: currentTime,
          value: (tokenData.volume || 1000) / 1000, // Scale down volume
          color: "#4bffb5"
        });
      }
    });

    return () => unsubscribe();
  }, [selectedToken, lastUpdateTime]);

  return (
    <div className="bg-[#0b0f19] rounded-lg overflow-hidden">
      <div className="p-2 border-b border-[#1f2733] flex items-center justify-end space-x-2">
        {TIMEFRAMES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setSelectedTimeframe(value)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              selectedTimeframe === value
                ? 'bg-[#4bffb5] text-[#0b0f19] font-medium'
                : 'text-[#d1d4dc] hover:bg-[#1f2733]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div ref={chartContainerRef} className="w-full h-[500px]" />
    </div>
  );
};

export default TradingChart;