import { addDays, formatClock, greetingKey, localDay, remainingParts } from '@/lib/time';
import { currentStreak, longestStreak } from '../streak';

describe('streaks', () => {
  const today = '2026-11-17';

  it('is 0 with no practice', () => {
    expect(currentStreak([], today)).toBe(0);
    expect(longestStreak([])).toBe(0);
  });

  it('counts back from today when today has practice', () => {
    expect(currentStreak(['2026-11-15', '2026-11-16', '2026-11-17'], today)).toBe(3);
  });

  it('stays alive from yesterday when today has no practice yet', () => {
    expect(currentStreak(['2026-11-15', '2026-11-16'], today)).toBe(2);
  });

  it('breaks on a gap', () => {
    expect(currentStreak(['2026-11-14', '2026-11-16', '2026-11-17'], today)).toBe(2);
    expect(currentStreak(['2026-11-14', '2026-11-15'], today)).toBe(0);
  });

  it('crosses month and year boundaries', () => {
    expect(currentStreak(['2025-12-31', '2026-01-01'], '2026-01-01')).toBe(2);
    expect(currentStreak(['2026-02-28', '2026-03-01'], '2026-03-01')).toBe(2);
  });

  it('longest streak ignores duplicates and order', () => {
    expect(longestStreak(['2026-11-03', '2026-11-01', '2026-11-02', '2026-11-02', '2026-11-10', '2026-11-11'])).toBe(3);
  });
});

describe('time helpers', () => {
  it('addDays handles DST-free calendar math', () => {
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('localDay uses the device zone', () => {
    const d = new Date(2026, 10, 17, 23, 59);
    expect(localDay(d.getTime())).toBe('2026-11-17');
  });

  it('formats the clock, rounding up', () => {
    expect(formatClock(522_000)).toBe('08:42');
    expect(formatClock(1)).toBe('00:01');
    expect(formatClock(-5)).toBe('00:00');
  });

  it('splits remaining time for spoken labels', () => {
    expect(remainingParts(522_000)).toEqual({ m: 8, s: 42 });
    expect(remainingParts(59_001)).toEqual({ m: 1, s: 0 });
    expect(remainingParts(0)).toEqual({ m: 0, s: 0 });
  });

  it('picks a greeting by hour', () => {
    expect(greetingKey(new Date(2026, 0, 1, 6))).toBe('greetingMorning');
    expect(greetingKey(new Date(2026, 0, 1, 13))).toBe('greetingAfternoon');
    expect(greetingKey(new Date(2026, 0, 1, 20))).toBe('greetingEvening');
  });
});
