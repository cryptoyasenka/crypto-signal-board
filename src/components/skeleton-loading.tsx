'use client';

import { cn } from '@/lib/cn';

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-zinc-800/80 rounded-lg animate-pulse',
        className,
      )}
    />
  );
}

interface Props {
  phase: string;
}

export function SkeletonLoading({ phase }: Props) {
  return (
    <div className="space-y-6">
      {/* Phase indicator */}
      <div className="flex flex-col items-center py-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-300 font-medium text-sm">{phase}</span>
        </div>
        <span className="text-zinc-500 text-xs mt-1">This may take 10-20 seconds</span>
      </div>

      {/* Price Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Bone className="w-40 h-8" />
            <Bone className="w-16 h-6 rounded-full" />
          </div>
          <Bone className="w-56 h-10" />
        </div>
        <div className="flex gap-6">
          <div>
            <Bone className="w-12 h-3 mb-1" />
            <Bone className="w-20 h-5" />
          </div>
          <div>
            <Bone className="w-12 h-3 mb-1" />
            <Bone className="w-20 h-5" />
          </div>
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
        <Bone className="w-40 h-4 mb-3" />
        <Bone className="w-full h-[160px]" />
      </div>

      {/* Verdict skeleton */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bone className="w-8 h-8 rounded-lg" />
            <div>
              <Bone className="w-28 h-7 mb-1" />
              <Bone className="w-16 h-3" />
            </div>
          </div>
          <div className="text-right">
            <Bone className="w-14 h-8 mb-1 ml-auto" />
            <Bone className="w-16 h-3 ml-auto" />
          </div>
        </div>
        <Bone className="w-full h-4 mb-2" />
        <Bone className="w-3/4 h-4" />
      </div>

      {/* Consensus skeleton */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
        <Bone className="w-36 h-5 mb-4" />
        <div className="flex justify-between mb-2">
          <Bone className="w-16 h-3" />
          <Bone className="w-16 h-3" />
          <Bone className="w-16 h-3" />
        </div>
        <Bone className="w-full h-3 rounded-full" />
      </div>

      {/* Indicator cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <Bone className="w-10 h-4" />
              <Bone className="w-16 h-4" />
            </div>
            <Bone className="w-24 h-6 mb-1" />
            <Bone className="w-32 h-3 mb-1" />
            <Bone className="w-full h-3" />
          </div>
        ))}
      </div>

      {/* Macro skeleton */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bone className="w-5 h-5 rounded" />
          <Bone className="w-36 h-5" />
        </div>
        <Bone className="w-full h-4 mb-2" />
        <Bone className="w-2/3 h-4" />
      </div>
    </div>
  );
}
