import path from 'path';
import fs from 'fs';
import { fetchCandles, type Pair } from './binance';

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

interface ModelWeights {
  W: number[][];  // [40][1]
  B: number[];    // [1]
}

let weights: ModelWeights | null = null;

function getWeights(): ModelWeights {
  if (weights) return weights;
  if (!fs.existsSync(WEIGHTS_PATH)) {
    throw new Error('Model weights not found — models/volatility-weights.json is missing');
  }
  weights = JSON.parse(fs.readFileSync(WEIGHTS_PATH, 'utf-8')) as ModelWeights;
  return weights;
}

/**
 * Pure TypeScript inference: Reshape [10,4] -> [1,40], MatMul with W, Add B, Abs.
 */
function infer(ohlcFlat: number[]): number {
  const { W, B } = getWeights();
  // MatMul: [1,40] x [40,1] -> scalar
  let sum = 0;
  for (let i = 0; i < 40; i++) {
    sum += ohlcFlat[i] * W[i][0];
  }
  return Math.abs(sum + B[0]);
}

/**
 * Run the 1-hour volatility model locally.
 * Input: 10 x 30-min OHLC candles → Output: predicted volatility %
 */
async function runVolatilityModel(pair: Pair): Promise<ModelPrediction> {
  const candles30m = await fetchCandles(pair, '30m', 10);
  const ohlcFlat = candles30m.flatMap((c) => [c.open, c.high, c.low, c.close]);

  console.log('[og-models] Running volatility model for', pair, '- input:', candles30m.length, 'candles');

  const volatility = infer(ohlcFlat);

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
