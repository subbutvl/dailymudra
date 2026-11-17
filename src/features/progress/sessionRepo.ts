import { getDb } from '@/db/db';
import { localDay } from '@/lib/time';
import { currentStreak, longestStreak } from './streak';

/** The only module that touches SQL for sessions (docs/SPEC.md §3.4). */

export const MIN_CREDITED_SEC = 60;

export interface SessionRecord {
  mudraId: string;
  startedAt: number;
  endedAt: number;
  plannedSec: number;
  practicedSec: number;
  completed: boolean;
}

export interface Stats {
  todayMin: number;
  totalMin: number;
  streak: number;
  longestStreak: number;
  sessionCount: number;
}

/** Saves a session if it reaches the crediting threshold. Returns whether it was saved. */
export function saveSession(s: SessionRecord): boolean {
  const practiced = Math.max(0, Math.min(s.plannedSec, Math.round(s.practicedSec)));
  if (practiced < MIN_CREDITED_SEC) return false;
  getDb().runSync(
    `INSERT INTO sessions (mudra_id, started_at, ended_at, planned_sec, practiced_sec, completed, local_day)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    s.mudraId,
    s.startedAt,
    s.endedAt,
    s.plannedSec,
    practiced,
    s.completed ? 1 : 0,
    localDay(s.startedAt),
  );
  return true;
}

export function getStats(now: number = Date.now()): Stats {
  const db = getDb();
  const today = localDay(now);
  const totals = db.getFirstSync<{ total: number | null; count: number }>(
    'SELECT SUM(practiced_sec) AS total, COUNT(*) AS count FROM sessions',
  );
  const todayRow = db.getFirstSync<{ total: number | null }>(
    'SELECT SUM(practiced_sec) AS total FROM sessions WHERE local_day = ?',
    today,
  );
  const days = db
    .getAllSync<{ local_day: string }>('SELECT DISTINCT local_day FROM sessions')
    .map((r) => r.local_day);
  return {
    todayMin: Math.floor((todayRow?.total ?? 0) / 60),
    totalMin: Math.floor((totals?.total ?? 0) / 60),
    streak: currentStreak(days, today),
    longestStreak: longestStreak(days),
    sessionCount: totals?.count ?? 0,
  };
}

export function resetProgress(): void {
  getDb().runSync('DELETE FROM sessions');
}
