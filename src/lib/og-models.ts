import path from 'path';
import fs from 'fs';
import { fetchCandles, type Pair } from './binance';

const ONNX_PATH = path.join(process.cwd(), 'models', 'volatility.onnx');
const WEIGHTS_PATH = path.join(process.cwd(), 'models', 'volatility-weights.json');
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

// --- ONNX Runtime inference (preferred) ---

let onnxSession: unknown = null;
let onnxAvailable: boolean | null = null;

async function tryOnnxInference(ohlcFlat: number[]): Promise<number | null> {
  if (onnxAvailable === false) return null;

  try {
    // Dynamic import — fails gracefully on platforms without native binaries
    const ort = await import('onnxruntime-node');

    if (!onnxSession) {
      if (!fs.existsSync(ONNX_PATH)) return null;
      onnxSession = await ort.InferenceSession.create(ONNX_PATH);
    }

    const session = onnxSession as import('onnxruntime-node').InferenceSession;
    const inputTensor = new ort.Tensor('float32', new Float32Array(ohlcFlat), [10, 4]);
    const results = await session.run({ open_high_low_close: inputTensor });
    const value = results.Y.data[0] as number;

    onnxAvailable = true;
    return Math.abs(value);
  } catch {
    onnxAvailable = false;
    return null;
  }
}

// --- Pure TypeScript fallback (for Vercel serverless) ---

interface ModelWeights {
  W: number[][];
  B: number[];
}

let weights: ModelWeights | null = null;

function tsFallbackInference(ohlcFlat: number[]): number {
  if (!weights) {
    if (!fs.existsSync(WEIGHTS_PATH)) {
      throw new Error('Neither ONNX runtime nor weights file available');
    }
    weights = JSON.parse(fs.readFileSync(WEIGHTS_PATH, 'utf-8')) as ModelWeights;
  }
  let sum = 0;
  for (let i = 0; i < 40; i++) {
    sum += ohlcFlat[i] * weights.W[i][0];
  }
  return Math.abs(sum + weights.B[0]);
}

// --- Public API ---

async function runVolatilityModel(pair: Pair): Promise<ModelPrediction> {
  const candles30m = await fetchCandles(pair, '30m', 10);
  const ohlcFlat = candles30m.flatMap((c) => [c.open, c.high, c.low, c.close]);

  // Try ONNX runtime first, fallback to TS
  let volatility = await tryOnnxInference(ohlcFlat);
  const engine = volatility !== null ? 'onnxruntime' : 'ts-fallback';
  if (volatility === null) {
    volatility = tsFallbackInference(ohlcFlat);
  }

  let interpretation: string;
  let signal: 'bullish' | 'bearish' | 'neutral';

  if (volatility < 0.5) {
    interpretation = 'Low volatility expected — stable market, range trading favorable';
    signal = 'neutral';
  } else if (volatility < 1.5) {
    interpretation = 'Moderate volatility — normal market conditions';
    signal = 'neutral';
  } else if (volatility < 3.0) {
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
