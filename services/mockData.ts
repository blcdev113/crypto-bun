// Generate random candlestick data for the chart
export const generateChartData = (timeframe: string) => {
  const data = [];
  const basePrice = 62500;
  const volatility = 500;
  let previousClose = basePrice;
  
  // Number of candles based on timeframe
  const candleCount = timeframe === '1d' ? 30 : 100;
  
  for (let i = 0; i < candleCount; i++) {
    const range = (Math.random() * volatility) + 50;
    const change = (Math.random() - 0.5) * range;
    const open = previousClose;
    const close = open + change;
    const high = Math.max(open, close) + (Math.random() * range * 0.5);
    const low = Math.min(open, close) - (Math.random() * range * 0.5);
    const volume = Math.random() * 1000 + 500;
    
    data.push({
      time: new Date(Date.now() - (candleCount - i) * getTimeframeMinutes(timeframe) * 60 * 1000),
      open,
      high,
      low,
      close,
      volume
    });
    
    previousClose = close;
  }
  
  return data;
};

// Get minutes for timeframe
const getTimeframeMinutes = (timeframe: string): number => {
  switch (timeframe) {
    case '1m': return 1;
    case '5m': return 5;
    case '15m': return 15;
    case '1h': return 60;
    case '4h': return 240;
    case '1d': return 1440;
    case '1w': return 10080;
    default: return 15;
  }
};

// Generate order book data
export const generateOrderBookData = (
  existingAsks: any[] = [], 
  existingBids: any[] = []
) => {
  const basePrice = 62845.21;
  const spreadPercentage = 0.05; // 0.05% spread
  const spreadAmount = basePrice * (spreadPercentage / 100);
  
  const bestBidPrice = basePrice - spreadAmount / 2;
  const bestAskPrice = basePrice + spreadAmount / 2;
  
  let asks = existingAsks.length > 0 ? [...existingAsks] : [];
  let bids = existingBids.length > 0 ? [...existingBids] : [];
  
  // If no existing data, generate from scratch
  if (asks.length === 0) {
    for (let i = 0; i < 30; i++) {
      const price = bestAskPrice * (1 + (i * 0.0005));
      const amount = Math.random() * 2 + 0.1;
      asks.push({
        price,
        amount,
        total: price * amount,
        depth: 1 - (i / 40)
      });
    }
  } else {
    // Update a few random orders
    for (let i = 0; i < 3; i++) {
      const index = Math.floor(Math.random() * asks.length);
      const amount = Math.random() * 2 + 0.1;
      asks[index] = {
        ...asks[index],
        amount,
        total: asks[index].price * amount
      };
    }
    
    // Sort asks ascending by price
    asks.sort((a, b) => a.price - b.price);
  }
  
  if (bids.length === 0) {
    for (let i = 0; i < 30; i++) {
      const price = bestBidPrice * (1 - (i * 0.0005));
      const amount = Math.random() * 2 + 0.1;
      bids.push({
        price,
        amount,
        total: price * amount,
        depth: 1 - (i / 40)
      });
    }
  } else {
    // Update a few random orders
    for (let i = 0; i < 3; i++) {
      const index = Math.floor(Math.random() * bids.length);
      const amount = Math.random() * 2 + 0.1;
      bids[index] = {
        ...bids[index],
        amount,
        total: bids[index].price * amount
      };
    }
    
    // Sort bids descending by price
    bids.sort((a, b) => b.price - a.price);
  }
  
  return { asks, bids };
};

// Generate sparkline data for token list
export const sparklineData = (): number[] => {
  const data = [];
  let value = 50;
  
  for (let i = 0; i < 24; i++) {
    value += (Math.random() - 0.5) * 10;
    if (value < 10) value = 10;
    if (value > 100) value = 100;
    data.push(value);
  }
  
  return data;
};