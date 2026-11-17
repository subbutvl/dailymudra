import { addDays } from '@/lib/time';

/**
 * Streaks from the set of practice days (docs/SPEC.md §1.3).
 * Current streak starts at today if today has practice, otherwise at yesterday
 * (a streak stays alive until the day ends).
 */
export function currentStreak(days: Iterable<string>, today: string): number {
  const set = new Set(days);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (set.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function longestStreak(days: Iterable<string>): number {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev !== null && addDays(prev, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}
