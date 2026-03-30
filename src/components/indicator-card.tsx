'use client';

import { cn } from '@/lib/cn';
import type { IndicatorResult } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const signalConfig = {
  bullish: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Bullish' },
  bearish: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Bearish' },
  neutral: { icon: Minus, color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20', label: 'Neutral' },
};

export function IndicatorCard({ indicator }: { indicator: IndicatorResult }) {
  const config = signalConfig[indicator.signal];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-xl border p-4 transition-all hover:scale-[1.02]', config.bg)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-zinc-300">{indicator.shortName}</span>
        <div className={cn('flex items-center gap-1 text-xs font-semibold', config.color)}>
          <Icon className="w-3.5 h-3.5" />
          {config.label}
        </div>
      </div>
      <div className="text-lg font-mono font-bold text-white mb-1">{indicator.value}</div>
      <div className="text-xs text-zinc-500 leading-relaxed">{indicator.name}</div>
      <div className="text-xs text-zinc-400 mt-1">{indicator.detail}</div>
    </div>
  );
}
