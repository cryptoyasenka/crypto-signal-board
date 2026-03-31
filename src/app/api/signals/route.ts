import { NextRequest, NextResponse } from 'next/server';
import { fetchCandles, fetchCurrentPrice, fetch24hStats, ALL_PAIRS, type Pair } from '@/lib/binance';
import { analyzeAll, getConsensus } from '@/lib/indicators';
import { getAIVerdict } from '@/lib/opengradient';
import { runModelHub } from '@/lib/og-models';
import type { SignalResponse, ModelPrediction } from '@/lib/types';

export async function GET(req: NextRequest) {
  const pair = (req.nextUrl.searchParams.get('pair') ?? 'BTCUSDT').toUpperCase() as Pair;

  if (!(ALL_PAIRS as readonly string[]).includes(pair)) {
    return NextResponse.json({ error: `Invalid pair. Use: ${ALL_PAIRS.join(', ')}` }, { status: 400 });
  }

  try {
    // Fetch market data in parallel
    const [candles, price, stats] = await Promise.all([
      fetchCandles(pair, '1h', 100),
      fetchCurrentPrice(pair),
      fetch24hStats(pair),
    ]);

    // Calculate technical indicators
    const indicators = analyzeAll(candles);
    const consensus = getConsensus(indicators);

    // Run AI verdict + Model Hub in parallel (both with graceful fallback)
    let ai: import('@/lib/types').AIVerdict;
    let models: ModelPrediction[] = [];

    const [aiResult, modelsResult] = await Promise.allSettled([
      getAIVerdict(pair, price, stats, indicators, candles),
      runModelHub(pair),
    ]);

    if (aiResult.status === 'fulfilled') {
      ai = aiResult.value;
    } else {
      console.warn('[signals] TEE unavailable:', aiResult.reason instanceof Error ? aiResult.reason.message : aiResult.reason);
      ai = {
        macro_events: [],
        macro_risk: 'low',
        combined_verdict: 'neutral',
        confidence: 0,
        summary: 'AI analysis unavailable — TEE node could not be reached. Showing technical indicators only.',
        txHash: null,
      };
    }

    if (modelsResult.status === 'fulfilled') {
      models = modelsResult.value;
    } else {
      console.warn('[signals] Model Hub unavailable:', modelsResult.reason instanceof Error ? modelsResult.reason.message : modelsResult.reason);
    }

    const miniCandles = candles.slice(-48).map((c) => ({
      time: c.openTime,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const response: SignalResponse = {
      pair,
      price,
      stats,
      candles: miniCandles,
      indicators,
      consensus,
      ai,
      models,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[signals] Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message.includes('APP_WALLET_PRIVATE_KEY')) {
      return NextResponse.json({ error: 'Server wallet not configured' }, { status: 500 });
    }
    // Shorten viem contract errors
    if (message.includes('readContract') || message.includes('eth_call')) {
      return NextResponse.json({ error: 'Failed to connect to blockchain RPC' }, { status: 502 });
    }
    if (message.includes('TEE')) {
      return NextResponse.json({ error: `AI analysis unavailable — ${message}` }, { status: 502 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
