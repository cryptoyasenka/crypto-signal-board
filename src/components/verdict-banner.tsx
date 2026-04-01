'use client';

import { cn } from '@/lib/cn';
import { TrendingUp, TrendingDown, Minus, ShieldCheck, WifiOff } from 'lucide-react';

const verdictConfig = {
  strong_buy: { icon: TrendingUp, color: 'text-og-success', bg: 'from-og-success/20 to-og-success/5 border-og-success/30', label: 'Strong Buy' },
  buy: { icon: TrendingUp, color: 'text-og-success', bg: 'from-og-success/10 to-og-success/5 border-og-success/20', label: 'Buy' },
  neutral: { icon: Minus, color: 'text-zinc-300', bg: 'from-og-mid/30 to-og-card/50 border-og-mid/30', label: 'Neutral' },
  sell: { icon: TrendingDown, color: 'text-og-error', bg: 'from-og-error/10 to-og-error/5 border-og-error/20', label: 'Sell' },
  strong_sell: { icon: TrendingDown, color: 'text-og-error', bg: 'from-og-error/20 to-og-error/5 border-og-error/30', label: 'Strong Sell' },
};

interface Props {
  verdict: keyof typeof verdictConfig;
  confidence: number;
  summary: string;
  txHash: string | null;
}

export function VerdictBanner({ verdict, confidence, summary, txHash }: Props) {
  const unavailable = confidence === 0;
  const config = verdictConfig[verdict];
  const Icon = unavailable ? WifiOff : config.icon;

  return (
    <div className={cn(
      'rounded-xl border bg-gradient-to-br p-6',
      unavailable ? 'from-og-card to-og-navy border-og-mid/40' : config.bg,
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon className={cn('w-8 h-8', unavailable ? 'text-zinc-500' : config.color)} />
          <div>
            <div className={cn('text-2xl font-bold', unavailable ? 'text-zinc-400' : config.color)}>
              {unavailable ? 'AI Unavailable' : config.label}
            </div>
            <div className="text-xs text-zinc-400">AI Verdict</div>
          </div>
        </div>
        {!unavailable && (
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{confidence}%</div>
            <div className="text-xs text-zinc-400">Confidence</div>
          </div>
        )}
      </div>

      <p className={cn('text-sm leading-relaxed mb-4', unavailable ? 'text-zinc-500' : 'text-zinc-300')}>
        {summary}
      </p>

      {txHash && (
        <div className="flex items-center gap-2 text-xs text-og-primary/70">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified in TEE</span>
          <span className="text-og-mid">|</span>
          <span className="font-mono text-zinc-500 truncate max-w-[200px]">{txHash.slice(0, 32)}...</span>
        </div>
      )}
    </div>
  );
}
