'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { getHistory, clearHistory, type HistoryEntry } from '@/lib/history';
import { Clock, Trash2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const verdictLabels: Record<string, { label: string; color: string }> = {
  strong_buy: { label: 'Strong Buy', color: 'text-emerald-300' },
  buy: { label: 'Buy', color: 'text-emerald-400' },
  neutral: { label: 'Neutral', color: 'text-zinc-400' },
  sell: { label: 'Sell', color: 'text-red-400' },
  strong_sell: { label: 'Strong Sell', color: 'text-red-300' },
};

const verdictIcons: Record<string, typeof TrendingUp> = {
  strong_buy: TrendingUp,
  buy: TrendingUp,
  neutral: Minus,
  sell: TrendingDown,
  strong_sell: TrendingDown,
};

interface Props {
  refreshKey: number; // increment to re-read history
}

export function SignalHistory({ refreshKey }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
  }, [refreshKey]);

  if (history.length === 0) return null;

  const shown = expanded ? history : history.slice(0, 5);

  return (
    <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-500" />
          <h3 className="text-white font-semibold text-sm">Signal History</h3>
          <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
            {history.length}
          </span>
        </div>
        <button
          onClick={() => {
            clearHistory();
            setHistory([]);
          }}
          className="flex items-center gap-1 text-xs text-zinc-600 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      <div className="space-y-2">
        {shown.map((entry) => {
          const v = verdictLabels[entry.verdict] ?? verdictLabels.neutral;
          const Icon = verdictIcons[entry.verdict] ?? Minus;
          const symbol = entry.pair.replace('USDT', '');
          const time = new Date(entry.timestamp);

          return (
            <div
              key={entry.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-zinc-300 w-10">{symbol}</span>
                <span className="text-xs font-mono text-zinc-400">
                  ${entry.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn('flex items-center gap-1 text-xs font-semibold', v.color)}>
                  <Icon className="w-3 h-3" />
                  {v.label}
                </div>
                <span className="text-[10px] text-zinc-600 font-mono">
                  {entry.confidence}%
                </span>
                <span className="text-[10px] text-zinc-600">
                  {time.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  {' '}
                  {time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {history.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-3 mx-auto"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" /> Show all ({history.length})
            </>
          )}
        </button>
      )}
    </div>
  );
}
