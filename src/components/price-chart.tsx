'use client';

import { cn } from '@/lib/cn';
import type { MiniCandle } from '@/lib/types';

interface Props {
  candles: MiniCandle[];
  className?: string;
}

export function PriceChart({ candles, className }: Props) {
  if (!candles.length) return null;

  const width = 600;
  const height = 200;
  const padding = { top: 16, right: 8, bottom: 24, left: 52 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allHighs = candles.map((c) => c.high);
  const allLows = candles.map((c) => c.low);
  const minPrice = Math.min(...allLows);
  const maxPrice = Math.max(...allHighs);
  const priceRange = maxPrice - minPrice || 1;

  const candleWidth = Math.max(2, (chartW / candles.length) * 0.7);
  const gap = chartW / candles.length;

  const yScale = (price: number) =>
    padding.top + chartH - ((price - minPrice) / priceRange) * chartH;

  // Grid lines
  const gridLines = 4;
  const gridPrices = Array.from({ length: gridLines }, (_, i) =>
    minPrice + (priceRange * (i + 1)) / (gridLines + 1),
  );

  // Format price for axis
  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (p >= 1) return p.toFixed(2);
    return p.toFixed(4);
  };

  // Time labels (show ~5 labels)
  const labelStep = Math.max(1, Math.floor(candles.length / 5));
  const timeLabels = candles
    .map((c, i) => ({ i, time: c.time }))
    .filter((_, i) => i % labelStep === 0);

  return (
    <div className={cn('rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4', className)}>
      <h3 className="text-white font-semibold text-sm mb-3">Price Action (1h candles)</h3>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid */}
        {gridPrices.map((price) => (
          <g key={price}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={yScale(price)}
              y2={yScale(price)}
              stroke="#27272a"
              strokeWidth={0.5}
            />
            <text
              x={padding.left - 6}
              y={yScale(price) + 3}
              textAnchor="end"
              fill="#52525b"
              fontSize={9}
              fontFamily="monospace"
            >
              {formatPrice(price)}
            </text>
          </g>
        ))}

        {/* Time labels */}
        {timeLabels.map(({ i, time }) => (
          <text
            key={i}
            x={padding.left + i * gap + gap / 2}
            y={height - 4}
            textAnchor="middle"
            fill="#52525b"
            fontSize={8}
            fontFamily="monospace"
          >
            {new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            {' '}
            {new Date(time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </text>
        ))}

        {/* Candles */}
        {candles.map((c, i) => {
          const x = padding.left + i * gap + (gap - candleWidth) / 2;
          const isGreen = c.close >= c.open;
          const bodyTop = yScale(Math.max(c.open, c.close));
          const bodyBottom = yScale(Math.min(c.open, c.close));
          const bodyH = Math.max(1, bodyBottom - bodyTop);
          const wickX = x + candleWidth / 2;

          return (
            <g key={i}>
              {/* Wick */}
              <line
                x1={wickX}
                x2={wickX}
                y1={yScale(c.high)}
                y2={yScale(c.low)}
                stroke={isGreen ? '#34d399' : '#f87171'}
                strokeWidth={0.8}
              />
              {/* Body */}
              <rect
                x={x}
                y={bodyTop}
                width={candleWidth}
                height={bodyH}
                fill={isGreen ? '#34d399' : '#f87171'}
                rx={0.5}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
