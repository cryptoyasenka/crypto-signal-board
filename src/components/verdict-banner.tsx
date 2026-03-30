'use client';

import { cn } from '@/lib/cn';
import { TrendingUp, TrendingDown, Minus, ShieldCheck } from 'lucide-react';

const verdictConfig = {
  strong_buy: { icon: TrendingUp, color: 'text-emerald-300', bg: 'from-emerald-600/20 to-emerald-900/10 border-emerald-500/30', label: 'Strong Buy', emoji: '' },
  buy: { icon: TrendingUp, color: 'text-emerald-400', bg: 'from-emerald-600/10 to-emerald-900/5 border-emerald-500/20', label: 'Buy', emoji: '' },
  neutral: { icon: Minus, color: 'text-zinc-300', bg: 'from-zinc-600/10 to-zinc-900/5 border-zinc-500/20', label: 'Neutral', emoji: '' },
  sell: { icon: TrendingDown, color: 'text-red-400', bg: 'from-red-600/10 to-red-900/5 border-red-500/20', label: 'Sell', emoji: '' },
  strong_sell: { icon: TrendingDown, color: 'text-red-300', bg: 'from-red-600/20 to-red-900/10 border-red-500/30', label: 'Strong Sell', emoji: '' },
};

interface Props {
  verdict: keyof typeof verdictConfig;
  confidence: number;
  summary: string;
  txHash: string | null;
}

export function VerdictBanner({ verdict, confidence, summary, txHash }: Props) {
  const config = verdictConfig[verdict];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-xl border bg-gradient-to-br p-6', config.bg)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon className={cn('w-8 h-8', config.color)} />
          <div>
            <div className={cn('text-2xl font-bold', config.color)}>{config.label}</div>
            <div className="text-xs text-zinc-400">AI Verdict</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{confidence}%</div>
          <div className="text-xs text-zinc-400">Confidence</div>
        </div>
      </div>

      <p className="text-sm text-zinc-300 leading-relaxed mb-4">{summary}</p>

      {txHash && (
        <div className="flex items-center gap-2 text-xs text-cyan-400/70">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified in TEE</span>
          <span className="text-zinc-600">|</span>
          <span className="font-mono text-zinc-500 truncate max-w-[200px]">{txHash.slice(0, 32)}...</span>
        </div>
      )}
    </div>
  );
}
