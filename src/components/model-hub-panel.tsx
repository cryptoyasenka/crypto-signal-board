'use client';

import type { ModelPrediction } from '@/lib/types';
import { Brain, ExternalLink, Activity, TrendingDown, Minus } from 'lucide-react';

function SignalBadge({ signal }: { signal: ModelPrediction['signal'] }) {
  const styles = {
    bullish: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    bearish: 'bg-red-500/10 text-red-400 border-red-500/20',
    neutral: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
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
  // Map 0-5% volatility to 0-100% width
  const pct = Math.min(abs / 5 * 100, 100);
  const color = abs < 0.5 ? 'bg-emerald-500' : abs < 1.5 ? 'bg-yellow-500' : abs < 3 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ModelHubPanel({ predictions }: { predictions: ModelPrediction[] }) {
  if (!predictions.length) return null;

  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-violet-400" />
        <h3 className="text-white font-semibold">Model Hub — ML Predictions</h3>
        <span className="text-[10px] text-violet-400/60 bg-violet-500/10 px-1.5 py-0.5 rounded">
          on-chain ONNX
        </span>
      </div>

      <div className="space-y-4">
        {predictions.map((pred) => (
          <div key={pred.modelCid} className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-4">
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
              className="inline-flex items-center gap-1 text-[10px] text-violet-400/60 hover:text-violet-400 mt-2 transition-colors"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              Verify on-chain →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
