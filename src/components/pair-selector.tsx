'use client';

import { cn } from '@/lib/cn';

const PAIRS = ['BTCUSDT', 'ETHUSDT'] as const;

interface Props {
  selected: string;
  onSelect: (pair: string) => void;
  disabled?: boolean;
}

export function PairSelector({ selected, onSelect, disabled }: Props) {
  return (
    <div className="flex gap-2">
      {PAIRS.map((pair) => {
        const symbol = pair.replace('USDT', '');
        const active = pair === selected;
        return (
          <button
            key={pair}
            onClick={() => onSelect(pair)}
            disabled={disabled}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              active
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50 hover:text-zinc-300',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            {symbol}
          </button>
        );
      })}
    </div>
  );
}
