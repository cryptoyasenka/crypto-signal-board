'use client';

interface Props {
  bullish: number;
  bearish: number;
  neutral: number;
  total: number;
}

export function ConsensusBar({ bullish, bearish, neutral, total }: Props) {
  const bullPct = (bullish / total) * 100;
  const bearPct = (bearish / total) * 100;
  const neutPct = (neutral / total) * 100;

  return (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <span className="text-og-success font-medium">{bullish} Bullish</span>
        <span className="text-zinc-400">{neutral} Neutral</span>
        <span className="text-og-error font-medium">{bearish} Bearish</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-og-navy">
        {bullPct > 0 && (
          <div
            className="bg-og-success transition-all duration-500"
            style={{ width: `${bullPct}%` }}
          />
        )}
        {neutPct > 0 && (
          <div
            className="bg-og-mid transition-all duration-500"
            style={{ width: `${neutPct}%` }}
          />
        )}
        {bearPct > 0 && (
          <div
            className="bg-og-error transition-all duration-500"
            style={{ width: `${bearPct}%` }}
          />
        )}
      </div>
    </div>
  );
}
