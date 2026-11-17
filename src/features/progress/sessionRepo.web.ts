/**
 * Browser-preview stand-in for sessionRepo.ts, so the app can be opened with
 * `npx expo start --web`. Android uses the SQLite version.
 */
import { kvGet, kvSet } from '@/db/kv';
import { localDay } from '@/lib/time';
import type { SessionRecord, Stats } from './sessionRepo';
import { currentStreak, longestStreak } from './streak';

export const MIN_CREDITED_SEC = 60;
const KEY = 'web.sessions';

type Row = SessionRecord & { localDay: string };

export function saveSession(s: SessionRecord): boolean {
  const practiced = Math.max(0, Math.min(s.plannedSec, Math.round(s.practicedSec)));
  if (practiced < MIN_CREDITED_SEC) return false;
  const rows = kvGet<Row[]>(KEY, []);
  rows.push({ ...s, practicedSec: practiced, localDay: localDay(s.startedAt) });
  kvSet(KEY, rows);
  return true;
}

export function getStats(now: number = Date.now()): Stats {
  const rows = kvGet<Row[]>(KEY, []);
  const today = localDay(now);
  const days = rows.map((r) => r.localDay);
  const sum = (list: Row[]) => list.reduce((a, r) => a + r.practicedSec, 0);
  return {
    todayMin: Math.floor(sum(rows.filter((r) => r.localDay === today)) / 60),
    totalMin: Math.floor(sum(rows) / 60),
    streak: currentStreak(days, today),
    longestStreak: longestStreak(days),
    sessionCount: rows.length,
  };
}

export function resetProgress(): void {
  kvSet(KEY, []);
}
