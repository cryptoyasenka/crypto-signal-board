import { Client, InferenceMode } from 'opengradient-sdk';
import { fetchCandles, type Pair } from './binance';

// ETH/USDT 1-hour volatility model
const VOLATILITY_MODEL_CID = 'QmRhcpDXfYCKsimTmJYrAVM4Bbvck59Zb2onj3MHv9Kw5N';

// Token volatility model (multi-token)
const TOKEN_VOLATILITY_CID = 'QmZdSfHWGJyzBiB2K98egzu3MypPcv4R1ASypUxwZ1MFUG';

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

let ogClient: Client | null = null;

function getClient(): Client {
  if (ogClient) return ogClient;
  const pk = process.env.APP_WALLET_PRIVATE_KEY;
  if (!pk) throw new Error('APP_WALLET_PRIVATE_KEY not set');
  ogClient = new Client({ privateKey: pk });
  return ogClient;
}

/**
 * Run the ETH/USDT 1-hour volatility model.
 * Input: 10 x 30-min OHLC candles → Output: predicted volatility %
 */
async function runVolatilityModel(pair: Pair): Promise<ModelPrediction> {
  const candles30m = await fetchCandles(pair, '30m', 10);

  // Model expects: open_high_low_close = [[o,h,l,c], [o,h,l,c], ...]
  const ohlcMatrix = candles30m.map((c) => [c.open, c.high, c.low, c.close]);

  console.log('[og-models] Running volatility model for', pair, '- input:', ohlcMatrix.length, 'candles');

  const client = getClient();
  const [txHash, output] = await client.infer(
    VOLATILITY_MODEL_CID,
    InferenceMode.VANILLA,
    { open_high_low_close: ohlcMatrix as number[][] },
  );

  console.log('[og-models] Volatility result:', JSON.stringify(output));

  // Extract volatility value — model outputs Y as float percentage
  let volatility = 0;
  if (output && typeof output === 'object') {
    const out = output as Record<string, unknown>;
    if (typeof out.Y === 'number') {
      volatility = out.Y;
    } else if (Array.isArray(out.Y)) {
      volatility = Number(out.Y[0]) || 0;
    } else {
      // Try to find any numeric output
      for (const val of Object.values(out)) {
        if (typeof val === 'number') { volatility = val; break; }
        if (Array.isArray(val) && typeof val[0] === 'number') { volatility = val[0]; break; }
      }
    }
  }

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
    modelCid: VOLATILITY_MODEL_CID,
    prediction: `${volatility.toFixed(4)}%`,
    rawValue: volatility,
    interpretation,
    signal,
    txHash,
    explorerUrl: `https://explorer.opengradient.ai/tx/${txHash}`,
  };
}

/**
 * Run all available Model Hub models for the given pair.
 * Currently: volatility model (works for any pair — uses actual candle data).
 */
export async function runModelHub(pair: Pair): Promise<ModelPrediction[]> {
  const results: ModelPrediction[] = [];

  try {
    const volResult = await runVolatilityModel(pair);
    results.push(volResult);
  } catch (err) {
    console.error('[og-models] Volatility model failed:', err instanceof Error ? err.message : err);
  }

  return results;
}
