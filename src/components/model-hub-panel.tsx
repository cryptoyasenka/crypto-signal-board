'use client';

import type { ModelPrediction } from '@/lib/types';
import { Brain, ExternalLink, Activity, TrendingDown, Minus } from 'lucide-react';

function SignalBadge({ signal }: { signal: ModelPrediction['signal'] }) {
  const styles = {
    bullish: 'bg-og-success/10 text-og-success border-og-success/20',
    bearish: 'bg-og-error/10 text-og-error border-og-error/20',
    neutral: 'bg-og-mid/30 text-zinc-400 border-og-mid/40',
  };
  const icons = {
    bullish: <Activity className="w-3 h-3" />,
    bearish: <TrendingDown className="w-3 h-3" />,
    neutral: <Minus className="w-3 h-3" />,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[signal]}`}>
      {icons[signal]}
      {signal}
    </span>
  );
}

function VolatilityBar({ value }: { value: number }) {
  const abs = Math.abs(value);
  const pct = Math.min(abs / 5 * 100, 100);
  const color = abs < 0.5 ? 'bg-og-success' : abs < 1.5 ? 'bg-og-warning' : abs < 3 ? 'bg-orange-500' : 'bg-og-error';

  return (
    <div className="w-full h-1.5 bg-og-navy rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ModelHubPanel({ predictions, error }: { predictions: ModelPrediction[]; error?: string }) {
  if (!predictions.length && !error) return null;

  if (error) {
    return (
      <div className="rounded-xl border border-og-primary/10 bg-og-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-og-primary/50" />
          <h3 className="text-zinc-400 font-medium text-sm">Model Hub</h3>
          <span className="text-[10px] text-og-error/60 bg-og-error/10 px-1.5 py-0.5 rounded">offline</span>
        </div>
        <p className="text-xs text-zinc-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-og-primary/20 bg-og-primary/5 p-5">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <Brain className="w-4 h-4 text-og-primary" />
          <h3 className="text-white font-semibold">Model Hub — ML Predictions</h3>
          <span className="text-[10px] text-og-primary/60 bg-og-primary/10 px-1.5 py-0.5 rounded font-mono">
            ONNX Model
          </span>
        </div>
        <p className="text-xs text-zinc-500 ml-6">
          Volatility prediction from an ONNX neural network hosted on{' '}
          <a href="https://hub.opengradient.ai" target="_blank" rel="noopener noreferrer" className="text-og-primary/60 hover:text-og-primary transition-colors">OpenGradient Model Hub</a>.
          Shows expected price movement magnitude over the next hour.
        </p>
      </div>

      <div className="space-y-4">
        {predictions.map((pred) => (
          <div key={pred.modelCid} className="rounded-lg border border-og-mid/50 og-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{pred.modelName}</span>
                  <SignalBadge signal={pred.signal} />
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  {pred.modelCid.slice(0, 8)}...{pred.modelCid.slice(-6)}
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">{pred.prediction}</div>
                <span className="text-[10px] text-zinc-500">predicted vol</span>
              </div>
            </div>

            <VolatilityBar value={pred.rawValue} />

            <p className="text-xs text-zinc-400 mt-2">{pred.interpretation}</p>

            <a
              href={pred.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-og-primary/60 hover:text-og-primary mt-2 transition-colors"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              {pred.txHash === 'local-onnx' ? 'View on Model Hub →' : 'Verify on-chain →'}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
