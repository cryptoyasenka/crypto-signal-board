'use client';

import { cn } from '@/lib/cn';
import type { MacroEvent } from '@/lib/types';
import { AlertTriangle, Shield, Zap } from 'lucide-react';

const riskConfig = {
  low: { icon: Shield, color: 'text-og-success', bg: 'bg-og-success/10 border-og-success/30', label: 'Low Risk' },
  medium: { icon: Zap, color: 'text-og-warning', bg: 'bg-og-warning/10 border-og-warning/30', label: 'Medium Risk' },
  high: { icon: AlertTriangle, color: 'text-og-error', bg: 'bg-og-error/10 border-og-error/30', label: 'High Risk' },
};

const impactColors = {
  high: 'text-og-error bg-og-error/10',
  medium: 'text-og-warning bg-og-warning/10',
  low: 'text-zinc-400 bg-og-mid/30',
};

interface Props {
  events: MacroEvent[];
  risk: 'low' | 'medium' | 'high';
}

export function MacroPanel({ events, risk }: Props) {
  const config = riskConfig[risk];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-xl border p-5', config.bg)}>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon className={cn('w-5 h-5', config.color)} />
          <h3 className="text-white font-semibold">Macro Risk: {config.label}</h3>
        </div>
        <p className="text-xs text-zinc-500 ml-7">
          AI-assessed macro environment based on upcoming economic events (FOMC, CPI, ETF decisions, regulatory news) that may impact crypto markets.
        </p>
      </div>

      {events.length === 0 ? (
        <p className="text-zinc-400 text-sm">No significant macro events detected. Clear skies.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event, i) => (
            <div key={i} className="flex items-start gap-3">
              <span
                className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 mt-0.5',
                  impactColors[event.impact],
                )}
              >
                {event.impact}
              </span>
              <div>
                <div className="text-sm text-white font-medium">{event.event}</div>
                <div className="text-xs text-zinc-500">
                  {event.time} — {event.relevance}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
