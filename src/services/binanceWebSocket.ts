import { useToken } from '../context/TokenContext';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';
const BINANCE_REST_URL = 'https://api.binance.com/api/v3/ticker/24hr';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;

export interface TokenPrice {
  symbol: string;
  price: number;
  priceChange: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
  depth: number;
}

export interface OrderBookData {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

class BinanceWebSocket {
  private ws: WebSocket | null = null;
  private priceSubscribers: ((data: TokenPrice[]) => void)[] = [];
  private orderBookSubscribers: ((data: OrderBookData) => void)[] = [];
  private tokenData: Map<string, TokenPrice> = new Map();
  private orderBookData: Map<string, OrderBookData> = new Map();
  private reconnectAttempts: number = 0;
  private fetchRetryAttempts: number = 0;
  private symbols = [
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
    'ADAUSDT', 'DOGEUSDT', 'MATICUSDT', 'DOTUSDT', 'LINKUSDT',
    'AVAXUSDT', 'SHIBUSDT', 'LTCUSDT', 'UNIUSDT', 'ATOMUSDT',
    'NEARUSDT', 'ALGOUSDT', 'ICPUSDT', 'FTMUSDT', 'TRXUSDT'
  ];

  constructor() {
    this.connect();
    this.fetch24hData();
    
    this.tokenData.set('USDT', {
      symbol: 'USDT',
      price: 1,
      priceChange: 0,
      volume: 0
    });
  }

  private calculateRetryDelay(attempts: number): number {
    const delay = Math.min(
      INITIAL_RETRY_DELAY * Math.pow(2, attempts),
      MAX_RETRY_DELAY
    );
    return delay + Math.random() * 1000; // Add jitter
  }

  private async fetch24hData() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(BINANCE_REST_URL, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      data.forEach((ticker: any) => {
        if (this.symbols.includes(ticker.symbol)) {
          const existingData = this.tokenData.get(ticker.symbol);
          if (existingData) {
            this.tokenData.set(ticker.symbol, {
              ...existingData,
              priceChange: parseFloat(ticker.priceChangePercent)
            });
          } else {
            this.tokenData.set(ticker.symbol, {
              symbol: ticker.symbol,
              price: parseFloat(ticker.lastPrice),
              priceChange: parseFloat(ticker.priceChangePercent),
              volume: parseFloat(ticker.volume)
            });
          }
        }
      });

      this.notifyPriceSubscribers();
      this.fetchRetryAttempts = 0;
    } catch (error) {
      console.error('Failed to fetch 24h data:', error);
      
      if (this.fetchRetryAttempts < MAX_RETRIES) {
        const delay = this.calculateRetryDelay(this.fetchRetryAttempts);
        this.fetchRetryAttempts++;
        console.log(`Retrying 24h data fetch in ${delay}ms (attempt ${this.fetchRetryAttempts}/${MAX_RETRIES})`);
        setTimeout(() => this.fetch24hData(), delay);
      } else {
        console.error('Max retry attempts reached for 24h data fetch');
      }
    }
  }

  private connect() {
    try {
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
      }

      this.ws = new WebSocket(BINANCE_WS_URL);

      this.ws.onopen = () => {
        console.log('Connected to Binance WebSocket');
        this.reconnectAttempts = 0;
        this.subscribe();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.e === '24hrMiniTicker') {
            const symbol = data.s;
            const price = parseFloat(data.c);
            const volume = parseFloat(data.v);
            const existingData = this.tokenData.get(symbol);

            this.tokenData.set(symbol, {
              symbol,
              price,
              priceChange: existingData?.priceChange || 0,
              volume
            });

            this.notifyPriceSubscribers();
          } else if (data.e === 'depthUpdate') {
            this.updateOrderBook(data.s, data);
            this.notifyOrderBookSubscribers(data.s);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`WebSocket connection closed (code: ${event.code}, reason: ${event.reason})`);
        
        if (this.reconnectAttempts < MAX_RETRIES) {
          const delay = this.calculateRetryDelay(this.reconnectAttempts);
          this.reconnectAttempts++;
          console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${this.reconnectAttempts}/${MAX_RETRIES})`);
          setTimeout(() => this.connect(), delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Don't close the connection here, let the onclose handler handle reconnection
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      if (this.reconnectAttempts < MAX_RETRIES) {
        const delay = this.calculateRetryDelay(this.reconnectAttempts);
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), delay);
      }
    }
  }

  private subscribe() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        const tickerSubscribe = {
          method: 'SUBSCRIBE',
          params: this.symbols.map(symbol => `${symbol.toLowerCase()}@miniTicker`),
          id: 1
        };
        this.ws.send(JSON.stringify(tickerSubscribe));

        const orderBookSubscribe = {
          method: 'SUBSCRIBE',
          params: this.symbols.map(symbol => `${symbol.toLowerCase()}@depth@100ms`),
          id: 2
        };
        this.ws.send(JSON.stringify(orderBookSubscribe));
      } catch (error) {
        console.error('Error subscribing to WebSocket feeds:', error);
        this.ws?.close();
      }
    }
  }

  private updateOrderBook(symbol: string, data: any) {
    try {
      const bids = data.b.map((bid: string[], index: number) => ({
        price: parseFloat(bid[0]),
        amount: parseFloat(bid[1]),
        total: parseFloat(bid[0]) * parseFloat(bid[1]),
        depth: 1 - (index / data.b.length)
      }));

      const asks = data.a.map((ask: string[], index: number) => ({
        price: parseFloat(ask[0]),
        amount: parseFloat(ask[1]),
        total: parseFloat(ask[0]) * parseFloat(ask[1]),
        depth: 1 - (index / data.a.length)
      }));

      this.orderBookData.set(symbol, { symbol, bids, asks });
    } catch (error) {
      console.error('Error updating order book:', error);
    }
  }

  private notifyPriceSubscribers() {
    const data = Array.from(this.tokenData.values());
    this.priceSubscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in price subscriber callback:', error);
      }
    });
  }

  private notifyOrderBookSubscribers(symbol: string) {
    const data = this.orderBookData.get(symbol);
    if (data) {
      this.orderBookSubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in order book subscriber callback:', error);
        }
      });
    }
  }

  public onPriceUpdate(callback: (data: TokenPrice[]) => void) {
    this.priceSubscribers.push(callback);
    callback(Array.from(this.tokenData.values()));
    return () => {
      this.priceSubscribers = this.priceSubscribers.filter(sub => sub !== callback);
    };
  }

  public onOrderBookUpdate(callback: (data: OrderBookData) => void) {
    this.orderBookSubscribers.push(callback);
    return () => {
      this.orderBookSubscribers = this.orderBookSubscribers.filter(sub => sub !== callback);
    };
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const binanceWS = new BinanceWebSocket();