'use client';

import { cn } from '@/lib/cn';

const PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT', 'XRPUSDT', 'ADAUSDT', 'BNBUSDT'] as const;

interface Props {
  selected: string;
  onSelect: (pair: string) => void;
  disabled?: boolean;
}

export function PairSelector({ selected, onSelect, disabled }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
      {PAIRS.map((pair) => {
        const symbol = pair.replace('USDT', '');
        const active = pair === selected;
        return (
          <button
            key={pair}
            onClick={() => onSelect(pair)}
            disabled={disabled}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0',
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
