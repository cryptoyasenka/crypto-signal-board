import type { SignalResponse } from './types';

export interface HistoryEntry {
  id: string;
  pair: string;
  price: number;
  verdict: string;
  confidence: number;
  consensus: string;
  timestamp: string;
}

const STORAGE_KEY = 'signal-history';
const MAX_ENTRIES = 50;

export function saveToHistory(signal: SignalResponse): void {
  if (typeof window === 'undefined') return;

  const entry: HistoryEntry = {
    id: `${signal.pair}-${signal.timestamp}`,
    pair: signal.pair,
    price: signal.price,
    verdict: signal.ai.combined_verdict,
    confidence: signal.ai.confidence,
    consensus: signal.consensus.overall,
    timestamp: signal.timestamp,
  };

  const existing = getHistory();
  const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
