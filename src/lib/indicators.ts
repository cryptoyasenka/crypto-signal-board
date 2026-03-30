import type { Candle } from './binance';
import type { Signal, IndicatorResult } from './types';

export type { Signal, IndicatorResult };

// --- helpers ---

function fmtPrice(v: number): string {
  if (Math.abs(v) >= 1000) return v.toFixed(1);
  if (Math.abs(v) >= 1) return v.toFixed(2);
  if (Math.abs(v) >= 0.01) return v.toFixed(4);
  return v.toFixed(6);
}

function fmtSmall(v: number): string {
  if (Math.abs(v) >= 100) return v.toFixed(1);
  if (Math.abs(v) >= 1) return v.toFixed(2);
  if (Math.abs(v) >= 0.001) return v.toFixed(4);
  return v.toFixed(6);
}

function sma(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return result;
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    result.push(values[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

// --- indicators ---

function calcSMACrossover(candles: Candle[]): IndicatorResult {
  const closes = candles.map((c) => c.close);
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);

  const offset = closes.length - sma50.length;
  const sma20Aligned = sma20.slice(sma20.length - sma50.length);

  const curr20 = sma20Aligned[sma20Aligned.length - 1];
  const curr50 = sma50[sma50.length - 1];
  const prev20 = sma20Aligned[sma20Aligned.length - 2];
  const prev50 = sma50[sma50.length - 2];

  let signal: Signal = 'neutral';
  let detail = 'SMA 20 and SMA 50 are close together — no clear trend';

  if (curr20 > curr50 && prev20 <= prev50) {
    signal = 'bullish';
    detail = 'Golden cross — SMA 20 just crossed above SMA 50';
  } else if (curr20 < curr50 && prev20 >= prev50) {
    signal = 'bearish';
    detail = 'Death cross — SMA 20 just crossed below SMA 50';
  } else if (curr20 > curr50) {
    signal = 'bullish';
    detail = `SMA 20 (${fmtPrice(curr20)}) is above SMA 50 (${fmtPrice(curr50)}) — uptrend`;
  } else if (curr20 < curr50) {
    signal = 'bearish';
    detail = `SMA 20 (${fmtPrice(curr20)}) is below SMA 50 (${fmtPrice(curr50)}) — downtrend`;
  }

  return {
    name: 'SMA Crossover (20/50)',
    shortName: 'SMA',
    signal,
    value: `${fmtPrice(curr20)} / ${fmtPrice(curr50)}`,
    detail,
  };
}

function calcEMATrend(candles: Candle[]): IndicatorResult {
  const closes = candles.map((c) => c.close);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);

  const curr12 = ema12[ema12.length - 1];
  const curr26 = ema26[ema26.length - 1];
  const price = closes[closes.length - 1];

  let signal: Signal = 'neutral';
  let detail = 'Price is between EMA 12 and EMA 26';

  if (price > curr12 && curr12 > curr26) {
    signal = 'bullish';
    detail = `Price (${fmtPrice(price)}) > EMA12 (${fmtPrice(curr12)}) > EMA26 (${fmtPrice(curr26)}) — strong uptrend`;
  } else if (price < curr12 && curr12 < curr26) {
    signal = 'bearish';
    detail = `Price (${fmtPrice(price)}) < EMA12 (${fmtPrice(curr12)}) < EMA26 (${fmtPrice(curr26)}) — strong downtrend`;
  } else if (curr12 > curr26) {
    signal = 'bullish';
    detail = `EMA12 (${fmtPrice(curr12)}) above EMA26 (${fmtPrice(curr26)}) — mild uptrend`;
  } else {
    signal = 'bearish';
    detail = `EMA12 (${fmtPrice(curr12)}) below EMA26 (${fmtPrice(curr26)}) — mild downtrend`;
  }

  return {
    name: 'EMA Trend (12/26)',
    shortName: 'EMA',
    signal,
    value: `${fmtPrice(curr12)} / ${fmtPrice(curr26)}`,
    detail,
  };
}

function calcRSI(candles: Candle[]): IndicatorResult {
  const closes = candles.map((c) => c.close);
  const period = 14;
  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
  }

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  let signal: Signal = 'neutral';
  let detail = `RSI at ${rsi.toFixed(1)} — neutral zone`;

  if (rsi >= 70) {
    signal = 'bearish';
    detail = `RSI at ${rsi.toFixed(1)} — overbought, potential reversal down`;
  } else if (rsi <= 30) {
    signal = 'bullish';
    detail = `RSI at ${rsi.toFixed(1)} — oversold, potential reversal up`;
  } else if (rsi >= 60) {
    signal = 'bullish';
    detail = `RSI at ${rsi.toFixed(1)} — bullish momentum`;
  } else if (rsi <= 40) {
    signal = 'bearish';
    detail = `RSI at ${rsi.toFixed(1)} — bearish momentum`;
  }

  return {
    name: 'RSI (14)',
    shortName: 'RSI',
    signal,
    value: rsi.toFixed(1),
    detail,
  };
}

function calcMACD(candles: Candle[]): IndicatorResult {
  const closes = candles.map((c) => c.close);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);

  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    macdLine.push(ema12[i] - ema26[i]);
  }
  const signalLine = ema(macdLine, 9);

  const macd = macdLine[macdLine.length - 1];
  const sig = signalLine[signalLine.length - 1];
  const histogram = macd - sig;
  const prevHistogram = macdLine[macdLine.length - 2] - signalLine[signalLine.length - 2];

  let signal: Signal = 'neutral';
  let detail = 'MACD near signal line — no clear momentum';

  if (histogram > 0 && prevHistogram <= 0) {
    signal = 'bullish';
    detail = `MACD crossed above signal line — bullish crossover (histogram: ${fmtSmall(histogram)})`;
  } else if (histogram < 0 && prevHistogram >= 0) {
    signal = 'bearish';
    detail = `MACD crossed below signal line — bearish crossover (histogram: ${fmtSmall(histogram)})`;
  } else if (histogram > 0) {
    signal = 'bullish';
    detail = `MACD (${fmtSmall(macd)}) above signal (${fmtSmall(sig)}) — bullish momentum`;
  } else if (histogram < 0) {
    signal = 'bearish';
    detail = `MACD (${fmtSmall(macd)}) below signal (${fmtSmall(sig)}) — bearish momentum`;
  }

  return {
    name: 'MACD (12/26/9)',
    shortName: 'MACD',
    signal,
    value: `${fmtSmall(macd)} / ${fmtSmall(sig)}`,
    detail,
  };
}

function calcBollinger(candles: Candle[]): IndicatorResult {
  const closes = candles.map((c) => c.close);
  const period = 20;
  const recent = closes.slice(-period);
  const mean = recent.reduce((a, b) => a + b, 0) / period;
  const variance = recent.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
  const std = Math.sqrt(variance);

  const upper = mean + 2 * std;
  const lower = mean - 2 * std;
  const price = closes[closes.length - 1];
  const percentB = (price - lower) / (upper - lower);

  let signal: Signal = 'neutral';
  let detail = `Price in middle of Bollinger Bands (%B: ${(percentB * 100).toFixed(0)}%)`;

  if (price >= upper) {
    signal = 'bearish';
    detail = `Price (${fmtPrice(price)}) at upper band (${fmtPrice(upper)}) — overbought, %B: ${(percentB * 100).toFixed(0)}%`;
  } else if (price <= lower) {
    signal = 'bullish';
    detail = `Price (${fmtPrice(price)}) at lower band (${fmtPrice(lower)}) — oversold, %B: ${(percentB * 100).toFixed(0)}%`;
  } else if (percentB > 0.7) {
    signal = 'bearish';
    detail = `Price near upper band — %B: ${(percentB * 100).toFixed(0)}%, potential resistance`;
  } else if (percentB < 0.3) {
    signal = 'bullish';
    detail = `Price near lower band — %B: ${(percentB * 100).toFixed(0)}%, potential support`;
  }

  return {
    name: 'Bollinger Bands (20,2)',
    shortName: 'BB',
    signal,
    value: `${fmtPrice(lower)} / ${fmtPrice(mean)} / ${fmtPrice(upper)}`,
    detail,
  };
}

function calcVolumeProfile(candles: Candle[]): IndicatorResult {
  const recent = candles.slice(-10);
  const older = candles.slice(-30, -10);

  const recentAvgVol = recent.reduce((s, c) => s + c.volume, 0) / recent.length;
  const olderAvgVol = older.reduce((s, c) => s + c.volume, 0) / older.length;
  const ratio = recentAvgVol / olderAvgVol;

  const priceUp = recent[recent.length - 1].close > recent[0].close;

  let signal: Signal = 'neutral';
  let detail = `Volume ratio: ${ratio.toFixed(2)}x — normal activity`;

  if (ratio > 1.5 && priceUp) {
    signal = 'bullish';
    detail = `Volume surge ${ratio.toFixed(2)}x with price increase — strong buying pressure`;
  } else if (ratio > 1.5 && !priceUp) {
    signal = 'bearish';
    detail = `Volume surge ${ratio.toFixed(2)}x with price decrease — strong selling pressure`;
  } else if (ratio < 0.6) {
    signal = 'neutral';
    detail = `Low volume ${ratio.toFixed(2)}x — lack of conviction, choppy market`;
  }

  return {
    name: 'Volume Profile',
    shortName: 'VOL',
    signal,
    value: `${ratio.toFixed(2)}x`,
    detail,
  };
}

export function analyzeAll(candles: Candle[]): IndicatorResult[] {
  if (candles.length < 50) throw new Error('Need at least 50 candles');

  return [
    calcSMACrossover(candles),
    calcEMATrend(candles),
    calcRSI(candles),
    calcMACD(candles),
    calcBollinger(candles),
    calcVolumeProfile(candles),
  ];
}

export function getConsensus(indicators: IndicatorResult[]): {
  bullish: number;
  bearish: number;
  neutral: number;
  overall: Signal;
} {
  const bullish = indicators.filter((i) => i.signal === 'bullish').length;
  const bearish = indicators.filter((i) => i.signal === 'bearish').length;
  const neutral = indicators.length - bullish - bearish;

  let overall: Signal = 'neutral';
  if (bullish > bearish && bullish >= 3) overall = 'bullish';
  else if (bearish > bullish && bearish >= 3) overall = 'bearish';

  return { bullish, bearish, neutral, overall };
}
