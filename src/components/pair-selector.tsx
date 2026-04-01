'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { ChevronDown, Search } from 'lucide-react';

const PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'TRXUSDT', 'LINKUSDT',
  'DOTUSDT', 'SUIUSDT', 'NEARUSDT', 'PEPEUSDT', 'SHIBUSDT',
  'LTCUSDT', 'APTUSDT', 'ARBUSDT', 'OPUSDT', 'TONUSDT',
  'TAOUSDT', 'AAVEUSDT', 'ENAUSDT', 'LITUSDT', 'XPLUSDT',
] as const;

const TOP_PAIRS = PAIRS.slice(0, 7);
const MOBILE_COUNT = 2;

interface Props {
  selected: string;
  onSelect: (pair: string) => void;
  disabled?: boolean;
}

export function PairSelector({ selected, onSelect, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = search
    ? PAIRS.filter((p) => p.replace('USDT', '').toLowerCase().includes(search.toLowerCase()))
    : PAIRS;

  const selectedSymbol = selected.replace('USDT', '');
  const isInTopRow = TOP_PAIRS.includes(selected as typeof TOP_PAIRS[number]);

  return (
    <div className="flex items-center gap-1.5 min-w-0" ref={dropdownRef}>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide min-w-0 flex-1">
        {TOP_PAIRS.map((pair, idx) => {
          const symbol = pair.replace('USDT', '');
          const active = pair === selected;
          return (
            <button
              key={pair}
              onClick={() => { onSelect(pair); setOpen(false); }}
              disabled={disabled}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 og-btn',
                active
                  ? 'bg-og-primary/20 text-og-primary border border-og-primary/40'
                  : 'bg-og-card/50 text-zinc-400 border border-og-mid/50 hover:bg-og-mid/50 hover:text-zinc-300',
                disabled && 'opacity-50 cursor-not-allowed',
                idx >= MOBILE_COUNT && 'hidden sm:block',
              )}
            >
              {symbol}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 og-btn',
            !isInTopRow && selected !== 'BTCUSDT'
              ? 'bg-og-primary/20 text-og-primary border border-og-primary/40'
              : 'bg-og-card/50 text-zinc-400 border border-og-mid/50 hover:bg-og-mid/50 hover:text-zinc-300',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          {!isInTopRow ? selectedSymbol : 'More'}
          <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-og-card border border-og-mid/50 rounded-xl shadow-xl shadow-black/40 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-og-mid/50">
              <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pairs..."
                className="bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none w-full"
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <div className="text-xs text-zinc-600 text-center py-3">No pairs found</div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {filtered.map((pair) => {
                    const symbol = pair.replace('USDT', '');
                    const active = pair === selected;
                    return (
                      <button
                        key={pair}
                        onClick={() => {
                          onSelect(pair);
                          setOpen(false);
                          setSearch('');
                        }}
                        className={cn(
                          'px-2 py-1.5 rounded-lg text-xs font-medium transition-all text-center',
                          active
                            ? 'bg-og-primary/20 text-og-primary'
                            : 'text-zinc-400 hover:bg-og-mid hover:text-zinc-200',
                        )}
                      >
                        {symbol}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
