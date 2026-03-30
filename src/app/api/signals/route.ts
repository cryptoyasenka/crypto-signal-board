import { NextRequest, NextResponse } from 'next/server';
import { fetchCandles, fetchCurrentPrice, fetch24hStats, ALL_PAIRS, type Pair } from '@/lib/binance';
import { analyzeAll, getConsensus } from '@/lib/indicators';
import { getAIVerdict } from '@/lib/opengradient';
import type { SignalResponse } from '@/lib/types';

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

    // Get AI verdict with macro analysis via TEE (graceful fallback if unavailable)
    let ai: import('@/lib/types').AIVerdict;
    try {
      ai = await getAIVerdict(pair, price, stats, indicators, candles);
    } catch (teeErr) {
      console.warn('[signals] TEE unavailable, returning indicators only:', teeErr instanceof Error ? teeErr.message : teeErr);
      ai = {
        macro_events: [],
        macro_risk: 'low',
        combined_verdict: 'neutral',
        confidence: 0,
        summary: 'AI analysis unavailable — TEE node could not be reached. Showing technical indicators only.',
        txHash: null,
      };
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
