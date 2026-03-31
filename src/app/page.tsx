'use client';

import { useState, useCallback } from 'react';
import type { SignalResponse } from '@/lib/types';
import { PairSelector } from '@/components/pair-selector';
import { PriceHeader } from '@/components/price-header';
import { IndicatorCard } from '@/components/indicator-card';
import { ConsensusBar } from '@/components/consensus-bar';
import { MacroPanel } from '@/components/macro-panel';
import { VerdictBanner } from '@/components/verdict-banner';
import { PriceChart } from '@/components/price-chart';
import { SignalHistory } from '@/components/signal-history';
import { saveToHistory } from '@/lib/history';
import { AutoRefresh } from '@/components/auto-refresh';
import { SkeletonLoading } from '@/components/skeleton-loading';
import { ModelHubPanel } from '@/components/model-hub-panel';
import { Loader2, RefreshCw, ShieldCheck, BarChart3 } from 'lucide-react';

export default function Home() {
  const [pair, setPair] = useState('BTCUSDT');
  const [data, setData] = useState<SignalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<string>('');
  const [historyKey, setHistoryKey] = useState(0);

  const analyze = useCallback(async (selectedPair?: string) => {
    const p = selectedPair ?? pair;
    setLoading(true);
    setError(null);
    setData(null);
    setPhase('Fetching market data...');

    try {
      const timer1 = setTimeout(() => setPhase('Running technical analysis...'), 1500);
      const timer2 = setTimeout(() => setPhase('AI analyzing macro risks in TEE...'), 3000);

      const res = await fetch(`/api/signals?pair=${p}`);
      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed: ${res.status}`);
      }

      const result: SignalResponse = await res.json();
      setData(result);
      saveToHistory(result);
      setHistoryKey((k) => k + 1);
      setPhase('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setPhase('');
    } finally {
      setLoading(false);
    }
  }, [pair]);

  const handlePairSelect = (p: string) => {
    setPair(p);
    if (data) analyze(p);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2 sm:mb-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-lg">Crypto Signal Board</span>
              <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded hidden sm:inline">
                by OpenGradient
              </span>
            </div>
            {data && <AutoRefresh onRefresh={() => analyze()} loading={loading} />}
          </div>
          <div className="sm:mt-0">
            <PairSelector selected={pair} onSelect={handlePairSelect} disabled={loading} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Initial state */}
        {!data && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6">
              <BarChart3 className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Crypto Signal Board</h1>
            <p className="text-zinc-400 max-w-md mb-2">
              6 technical indicators + AI macro analysis, verified in a Trusted Execution Environment.
            </p>
            <p className="text-zinc-500 text-sm mb-8">
              Transparent signals. Verifiable predictions. No hidden agenda.
            </p>
            <button
              onClick={() => analyze()}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Analyze {pair.replace('USDT', '')}/USDT
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && <SkeletonLoading phase={phase} />}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-red-400 mb-4 text-lg font-medium">Analysis Failed</div>
            <div className="text-zinc-400 text-sm mb-6 max-w-md">{error}</div>
            <button
              onClick={() => analyze()}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div className="space-y-6">
            {/* Price Header */}
            <PriceHeader
              pair={data.pair}
              price={data.price}
              changePercent={data.stats.priceChangePercent}
              high24h={data.stats.high}
              low24h={data.stats.low}
            />

            {/* Price Chart */}
            <PriceChart candles={data.candles} />

            {/* AI Verdict */}
            <VerdictBanner
              verdict={data.ai.combined_verdict}
              confidence={data.ai.confidence}
              summary={data.ai.summary}
              txHash={data.ai.txHash}
            />

            {/* Indicator Consensus */}
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
              <h3 className="text-white font-semibold mb-4">Technical Indicators</h3>
              <ConsensusBar
                bullish={data.consensus.bullish}
                bearish={data.consensus.bearish}
                neutral={data.consensus.neutral}
                total={data.indicators.length}
              />
            </div>

            {/* Indicator Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {data.indicators.map((ind) => (
                <IndicatorCard key={ind.shortName} indicator={ind} />
              ))}
            </div>

            {/* Model Hub ML Predictions */}
            {data.models && data.models.length > 0 && (
              <ModelHubPanel predictions={data.models} />
            )}

            {/* Macro Risk */}
            <MacroPanel events={data.ai.macro_events} risk={data.ai.macro_risk} />

            {/* Signal History */}
            <SignalHistory refreshKey={historyKey} />

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-zinc-800/50">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-500/50" />
                AI analysis verified in OpenGradient TEE
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-600">
                  {new Date(data.timestamp).toLocaleTimeString()}
                </span>
                <button
                  onClick={() => analyze()}
                  className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors text-xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
