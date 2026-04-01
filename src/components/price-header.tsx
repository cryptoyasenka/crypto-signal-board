'use client';

import { cn } from '@/lib/cn';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  pair: string;
  price: number;
  changePercent: number;
  high24h: number;
  low24h: number;
}

export function PriceHeader({ pair, price, changePercent, high24h, low24h }: Props) {
  const isUp = changePercent >= 0;
  const symbol = pair.replace('USDT', '');

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white">{symbol}/USDT</h2>
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-semibold',
              isUp ? 'bg-og-success/10 text-og-success' : 'bg-og-error/10 text-og-error',
            )}
          >
            {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {isUp ? '+' : ''}{changePercent.toFixed(2)}%
          </div>
        </div>
        <div className="text-3xl sm:text-4xl font-bold font-mono text-white">
          ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
      <div className="flex gap-6 text-sm">
        <div>
          <div className="text-zinc-500 text-xs">24h High</div>
          <div className="text-zinc-300 font-mono">${high24h.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div>
          <div className="text-zinc-500 text-xs">24h Low</div>
          <div className="text-zinc-300 font-mono">${low24h.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
      </div>
    </div>
  );
}
