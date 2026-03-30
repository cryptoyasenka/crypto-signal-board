import { NextRequest, NextResponse } from 'next/server';
import { fetchCandles, fetchCurrentPrice, fetch24hStats, type Pair } from '@/lib/binance';
import { analyzeAll, getConsensus } from '@/lib/indicators';
import { getAIVerdict } from '@/lib/opengradient';
import type { SignalResponse } from '@/lib/types';

const VALID_PAIRS: Pair[] = ['BTCUSDT', 'ETHUSDT'];

export async function GET(req: NextRequest) {
  const pair = (req.nextUrl.searchParams.get('pair') ?? 'BTCUSDT').toUpperCase() as Pair;

  if (!VALID_PAIRS.includes(pair)) {
    return NextResponse.json({ error: `Invalid pair. Use: ${VALID_PAIRS.join(', ')}` }, { status: 400 });
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

    // Get AI verdict with macro analysis via TEE
    const ai = await getAIVerdict(pair, price, stats, indicators, candles);

    const response: SignalResponse = {
      pair,
      price,
      stats,
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
    if (message.includes('TEE')) {
      return NextResponse.json({ error: `AI analysis unavailable — ${message}` }, { status: 502 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
