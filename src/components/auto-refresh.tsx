'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { RefreshCw, Play } from 'lucide-react';

interface Props {
  onRefresh: () => void;
  loading: boolean;
  intervalSec?: number;
}

export function AutoRefresh({ onRefresh, loading, intervalSec = 60 }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [remaining, setRemaining] = useState(intervalSec);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      setRemaining(intervalSec);
      return;
    }

    setRemaining(intervalSec);
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          onRefresh();
          return intervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, intervalSec, onRefresh]);

  useEffect(() => {
    if (loading && enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
    } else if (!loading && enabled) {
      setRemaining(intervalSec);
      timerRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            onRefresh();
            return intervalSec;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, enabled, intervalSec, onRefresh]);

  const progress = ((intervalSec - remaining) / intervalSec) * 100;

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className={cn(
        'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all overflow-hidden',
        enabled
          ? 'bg-og-primary/15 text-og-primary border border-og-primary/30'
          : 'bg-og-card/50 text-zinc-400 border border-og-mid/50 hover:bg-og-mid/50',
      )}
    >
      {enabled && (
        <div
          className="absolute inset-0 bg-og-primary/10 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      )}
      <span className="relative flex items-center gap-1.5">
        {enabled ? (
          <>
            <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
            <span>{remaining}s</span>
          </>
        ) : (
          <>
            <Play className="w-3 h-3" />
            <span>Auto</span>
          </>
        )}
      </span>
    </button>
  );
}
