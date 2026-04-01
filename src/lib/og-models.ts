import * as ort from 'onnxruntime-node';
import path from 'path';
import fs from 'fs';
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

let session: ort.InferenceSession | null = null;

async function getSession(): Promise<ort.InferenceSession> {
  if (session) return session;
  if (!fs.existsSync(MODEL_PATH)) {
    throw new Error('Model file not found — models/volatility.onnx is missing');
  }
  session = await ort.InferenceSession.create(MODEL_PATH);
  return session;
}

/**
 * Run the ETH/USDT 1-hour volatility model locally via ONNX Runtime.
 * Input: 10 x 30-min OHLC candles → Output: predicted volatility %
 */
async function runVolatilityModel(pair: Pair): Promise<ModelPrediction> {
  const candles30m = await fetchCandles(pair, '30m', 10);

  const ohlcMatrix = candles30m.map((c) => [c.open, c.high, c.low, c.close]);

  console.log('[og-models] Running local ONNX volatility model for', pair, '- input:', ohlcMatrix.length, 'candles');

  const flat = new Float32Array(ohlcMatrix.flat());
  const inputTensor = new ort.Tensor('float32', flat, [10, 4]);

  const sess = await getSession();
  const results = await sess.run({ open_high_low_close: inputTensor });

  const volatility = results.Y.data[0] as number;

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
