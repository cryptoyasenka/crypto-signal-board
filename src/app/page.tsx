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
import { RefreshCw, ShieldCheck, BarChart3, Code2, Brain, Lock, ExternalLink } from 'lucide-react';

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
    <main className="min-h-screen bg-og-navy text-white">
      {/* Header */}
      <div className="border-b border-og-mid/50 bg-og-navy/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setData(null); setError(null); setLoading(false); }}
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity group"
            >
              <div data-og-logo="wordmark" className="h-6" />
              <span className="text-base font-semibold text-white group-hover:text-og-primary transition-colors hidden sm:inline">
                Signal Board
              </span>
            </button>
            {data && <AutoRefresh onRefresh={() => analyze()} loading={loading} />}
          </div>
          <div className="mt-3">
            <PairSelector selected={pair} onSelect={handlePairSelect} disabled={loading} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Initial state */}
        {!data && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl og-hero-gradient border border-og-mid/50 flex items-center justify-center mb-6">
              <BarChart3 className="w-10 h-10 text-og-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-3">
              Crypto Signal Board
            </h1>
            <p className="text-zinc-400 max-w-lg mb-6 leading-relaxed">
              Select a trading pair, get an instant short-term signal: 6 technical indicators calculated from 48 hours of candle data, combined with an AI macro-risk verdict generated inside an{' '}
              <span className="text-og-primary">OpenGradient TEE</span> — cryptographically verified so no one can tamper with the result.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mb-10 text-left">
              <div className="rounded-xl border border-og-mid/50 og-card p-4">
                <BarChart3 className="w-5 h-5 text-og-primary mb-2" />
                <div className="text-sm font-medium text-zinc-200 mb-1">Technical Analysis</div>
                <p className="text-xs text-zinc-500 leading-relaxed">SMA, EMA, RSI, MACD, Bollinger Bands, Volume — computed from Binance 1h candles.</p>
              </div>
              <div className="rounded-xl border border-og-mid/50 og-card p-4">
                <ShieldCheck className="w-5 h-5 text-og-success mb-2" />
                <div className="text-sm font-medium text-zinc-200 mb-1">TEE-Verified AI</div>
                <p className="text-xs text-zinc-500 leading-relaxed">LLM runs inside a Trusted Execution Environment. Every prediction is signed and tamper-proof.</p>
              </div>
              <div className="rounded-xl border border-og-mid/50 og-card p-4">
                <Brain className="w-5 h-5 text-og-soft mb-2" />
                <div className="text-sm font-medium text-zinc-200 mb-1">ML Volatility Forecast</div>
                <p className="text-xs text-zinc-500 leading-relaxed">ONNX model from OpenGradient Model Hub predicts 1-hour price volatility.</p>
              </div>
            </div>

            <button
              onClick={() => analyze()}
              className="flex items-center gap-2 bg-og-primary hover:bg-og-soft text-og-navy font-semibold px-8 py-3.5 rounded-xl transition-colors text-lg"
            >
              <BarChart3 className="w-5 h-5" />
              Analyze Token
            </button>
            <p className="text-zinc-600 text-xs mt-3">Select any of 25 pairs above, then click Analyze</p>
          </div>
        )}

        {/* Loading */}
        {loading && <SkeletonLoading phase={phase} />}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-og-error mb-4 text-lg font-medium">Analysis Failed</div>
            <div className="text-zinc-400 text-sm mb-6 max-w-md">{error}</div>
            <button
              onClick={() => analyze()}
              className="flex items-center gap-2 bg-og-card hover:bg-og-mid text-white px-4 py-2 rounded-lg transition-colors text-sm border border-og-mid/50"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div className="space-y-6">
            <PriceHeader
              pair={data.pair}
              price={data.price}
              changePercent={data.stats.priceChangePercent}
              high24h={data.stats.high}
              low24h={data.stats.low}
            />

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3 text-og-primary/60" />
                Short-term signal based on last 48h of 1-hour candles
              </span>
              <span className="hidden sm:inline text-zinc-700">|</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-og-success/60" />
                AI verdict by OpenGradient TEE
              </span>
              <span className="hidden sm:inline text-zinc-700">|</span>
              <span className="flex items-center gap-1.5">
                <Brain className="w-3 h-3 text-og-soft/60" />
                Volatility forecast — 1h ahead via ONNX model
              </span>
            </div>

            <PriceChart candles={data.candles} />

            <VerdictBanner
              verdict={data.ai.combined_verdict}
              confidence={data.ai.confidence}
              summary={data.ai.summary}
              txHash={data.ai.txHash}
            />

            <div className="rounded-xl border border-og-mid/50 og-card p-5">
              <h3 className="text-white font-semibold mb-4">Technical Indicators</h3>
              <ConsensusBar
                bullish={data.consensus.bullish}
                bearish={data.consensus.bearish}
                neutral={data.consensus.neutral}
                total={data.indicators.length}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {data.indicators.map((ind) => (
                <IndicatorCard key={ind.shortName} indicator={ind} />
              ))}
            </div>

            <ModelHubPanel predictions={data.models ?? []} error={data.modelHubError} />

            <MacroPanel events={data.ai.macro_events} risk={data.ai.macro_risk} />

            <SignalHistory refreshKey={historyKey} />

            {/* About */}
            <div className="rounded-xl border border-og-mid/50 og-card p-5">
              <h3 className="text-white font-semibold mb-3">How it works</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-og-primary/10 border border-og-primary/20 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4 text-og-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-200">Technical Analysis</div>
                    <p className="text-xs text-zinc-500 mt-0.5">6 indicators (SMA, EMA, RSI, MACD, Bollinger, Volume) computed locally from Binance candles.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-og-success/10 border border-og-success/20 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-og-success" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-200">TEE-Verified AI</div>
                    <p className="text-xs text-zinc-500 mt-0.5">LLM runs inside a Trusted Execution Environment — predictions are cryptographically signed and tamper-proof.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-og-soft/10 border border-og-soft/20 flex items-center justify-center shrink-0">
                    <Brain className="w-4 h-4 text-og-soft" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-200">ML Model Hub</div>
                    <p className="text-xs text-zinc-500 mt-0.5">ONNX volatility model from OpenGradient Model Hub forecasts 1-hour price movement.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-og-mid/50">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-og-primary/50" />
                AI analysis verified in OpenGradient TEE
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/cryptoyasenka/crypto-signal-board"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-og-primary transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  GitHub
                </a>
                <a
                  href="https://opengradient.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-og-primary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  OpenGradient
                </a>
                <span className="text-xs text-zinc-600 font-mono">
                  {new Date(data.timestamp).toLocaleTimeString()}
                </span>
                <button
                  onClick={() => analyze()}
                  className="flex items-center gap-1.5 bg-og-card hover:bg-og-mid text-zinc-300 px-3 py-1.5 rounded-lg transition-colors text-xs border border-og-mid/50"
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
