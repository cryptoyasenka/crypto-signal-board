export type Signal = 'bullish' | 'bearish' | 'neutral';

export interface IndicatorResult {
  name: string;
  shortName: string;
  signal: Signal;
  value: string;
  detail: string;
}

export interface MacroEvent {
  event: string;
  time: string;
  impact: 'high' | 'medium' | 'low';
  relevance: string;
}

export interface AIVerdict {
  macro_events: MacroEvent[];
  macro_risk: 'low' | 'medium' | 'high';
  combined_verdict: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  confidence: number;
  summary: string;
  txHash: string | null;
}

export interface MiniCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ModelPrediction {
  modelName: string;
  modelCid: string;
  prediction: string;
  rawValue: number;
  interpretation: string;
  signal: Signal;
  txHash: string;
  explorerUrl: string;
}

export interface SignalResponse {
  pair: string;
  price: number;
  stats: {
    priceChangePercent: number;
    high: number;
    low: number;
    volume: number;
    quoteVolume: number;
  };
  candles: MiniCandle[];
  indicators: IndicatorResult[];
  consensus: {
    bullish: number;
    bearish: number;
    neutral: number;
    overall: Signal;
  };
  ai: AIVerdict;
  models: ModelPrediction[];
  modelHubError?: string;
  timestamp: string;
}
