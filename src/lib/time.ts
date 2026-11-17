/** 'YYYY-MM-DD' in the device time zone. */
export function localDay(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Shift a 'YYYY-MM-DD' string by whole days (calendar arithmetic, DST safe). */
export function addDays(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + delta));
  return date.toISOString().slice(0, 10);
}

/** 125000 ms → "02:05". Rounds up so the label shows 00:01 until the very end. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Whole minutes and seconds left, rounded up (for spoken labels). */
export function remainingParts(ms: number): { m: number; s: number } {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return { m: Math.floor(total / 60), s: total % 60 };
}

export function greetingKey(now: Date = new Date()): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  const h = now.getHours();
  if (h < 12) return 'greetingMorning';
  if (h < 17) return 'greetingAfternoon';
  return 'greetingEvening';
}
