import path from 'path';
import fs from 'fs';
import * as ort from 'onnxruntime-node';
import { fetchCandles, type Pair } from './binance';

const MODEL_PATH = path.join(process.cwd(), 'models', 'volatility.onnx');
const HUB_URL = 'https://hub.opengradient.ai/models/og-1hr-volatility-ethusdt';

export interface ModelPrediction {
  modelName: string;
  modelCid: string;
  prediction: string;
  rawValue: number;
  interpretation: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  txHash: string;
  explorerUrl: string;
}

let cachedSession: ort.InferenceSession | null = null;

async function getSession(): Promise<ort.InferenceSession> {
  if (cachedSession) return cachedSession;
  if (!fs.existsSync(MODEL_PATH)) {
    throw new Error('ONNX model not found — models/volatility.onnx is missing');
  }
  cachedSession = await ort.InferenceSession.create(MODEL_PATH);
  return cachedSession;
}

/**
 * Run the 1-hour volatility model locally via onnxruntime-node.
 * Input: 10 x 30-min OHLC candles (tensor [10, 4]) → Output: predicted volatility %
 */
async function runVolatilityModel(pair: Pair): Promise<ModelPrediction> {
  const candles30m = await fetchCandles(pair, '30m', 10);
  const ohlcFlat = candles30m.flatMap((c) => [c.open, c.high, c.low, c.close]);

  console.log('[og-models] Running ONNX volatility model for', pair, '- input:', candles30m.length, 'candles');

  const session = await getSession();
  const inputTensor = new ort.Tensor('float32', new Float32Array(ohlcFlat), [10, 4]);
  const results = await session.run({ open_high_low_close: inputTensor });
  const volatility = Math.abs(results.Y.data[0] as number);

  console.log('[og-models] Volatility result:', volatility);

  const absVol = Math.abs(volatility);
  let interpretation: string;
  let signal: 'bullish' | 'bearish' | 'neutral';

  if (absVol < 0.5) {
    interpretation = 'Low volatility expected — stable market, range trading favorable';
    signal = 'neutral';
  } else if (absVol < 1.5) {
    interpretation = 'Moderate volatility — normal market conditions';
    signal = 'neutral';
  } else if (absVol < 3.0) {
    interpretation = 'High volatility expected — strong moves likely, use caution';
    signal = 'bearish';
  } else {
    interpretation = 'Extreme volatility — potential breakout or crash, high risk';
    signal = 'bearish';
  }

  return {
    modelName: '1hr Volatility Forecast',
    modelCid: 'og-1hr-volatility-ethusdt',
    prediction: `${volatility.toFixed(4)}%`,
    rawValue: volatility,
    interpretation,
    signal,
    txHash: 'local-onnx',
    explorerUrl: HUB_URL,
  };
}

/**
 * Run all available Model Hub models for the given pair.
 */
export async function runModelHub(pair: Pair): Promise<ModelPrediction[]> {
  const results: ModelPrediction[] = [];

  try {
    const volResult = await runVolatilityModel(pair);
    results.push(volResult);
  } catch (err) {
    console.error('[og-models] Volatility model failed:', err instanceof Error ? err.message : err);
    throw err;
  }

  return results;
}
