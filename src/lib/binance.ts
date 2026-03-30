export interface Candle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

export type Pair = 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT' | 'DOGEUSDT' | 'XRPUSDT' | 'ADAUSDT' | 'BNBUSDT';

const BINANCE_API = 'https://api.binance.com/api/v3';

export async function fetchCandles(
  symbol: Pair,
  interval = '1h',
  limit = 100,
): Promise<Candle[]> {
  const url = `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Binance API error: ${res.status}`);

  const raw: unknown[][] = await res.json();
  return raw.map((k) => ({
    openTime: k[0] as number,
    open: parseFloat(k[1] as string),
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
    volume: parseFloat(k[5] as string),
    closeTime: k[6] as number,
  }));
}

export async function fetchCurrentPrice(symbol: Pair): Promise<number> {
  const url = `${BINANCE_API}/ticker/price?symbol=${symbol}`;
  const res = await fetch(url, { next: { revalidate: 10 } });
  if (!res.ok) throw new Error(`Binance price error: ${res.status}`);
  const data = await res.json();
  return parseFloat(data.price);
}

export async function fetch24hStats(symbol: Pair) {
  const url = `${BINANCE_API}/ticker/24hr?symbol=${symbol}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Binance 24h error: ${res.status}`);
  const d = await res.json();
  return {
    priceChange: parseFloat(d.priceChange),
    priceChangePercent: parseFloat(d.priceChangePercent),
    high: parseFloat(d.highPrice),
    low: parseFloat(d.lowPrice),
    volume: parseFloat(d.volume),
    quoteVolume: parseFloat(d.quoteVolume),
  };
}
