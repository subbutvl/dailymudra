import { elapsedMs, idleState, remainingMs, sessionReducer, type SessionState } from '../sessionReducer';

const T0 = 1_700_000_000_000;
const start = (plannedSec = 600) => sessionReducer(idleState, { type: 'START', mudraId: 'gyan', plannedSec, now: T0 });

describe('sessionReducer', () => {
  it('starts running with endsAt derived from the planned time', () => {
    const s = start();
    expect(s).toMatchObject({ status: 'running', startedAt: T0, endsAt: T0 + 600_000, pausedTotalMs: 0 });
    expect(remainingMs(s, T0 + 1000)).toBe(599_000);
  });

  it('TICK before endsAt changes nothing (same object)', () => {
    const s = start();
    expect(sessionReducer(s, { type: 'TICK', now: T0 + 5000 })).toBe(s);
  });

  it('TICK at or after endsAt completes with full credit, even after a long background gap', () => {
    const s = sessionReducer(start(), { type: 'TICK', now: T0 + 3_600_000 });
    expect(s).toMatchObject({ status: 'completed', practicedSec: 600, endedAt: T0 + 600_000 });
  });

  it('pause freezes remaining time; resume pushes endsAt out by the paused gap', () => {
    const paused = sessionReducer(start(), { type: 'PAUSE', now: T0 + 60_000 });
    expect(paused).toMatchObject({ status: 'paused', remainingMs: 540_000, pausedAt: T0 + 60_000 });
    expect(remainingMs(paused, T0 + 999_999)).toBe(540_000);
    expect(elapsedMs(paused, T0 + 999_999)).toBe(60_000);

    const resumed = sessionReducer(paused, { type: 'RESUME', now: T0 + 120_000 });
    expect(resumed).toMatchObject({ status: 'running', endsAt: T0 + 660_000, pausedTotalMs: 60_000 });
    expect(elapsedMs(resumed, T0 + 180_000)).toBe(120_000);
  });

  it('PAUSE after endsAt completes instead of pausing', () => {
    expect(sessionReducer(start(), { type: 'PAUSE', now: T0 + 700_000 }).status).toBe('completed');
  });

  it('ignores events that do not apply to the current status', () => {
    const s = start();
    expect(sessionReducer(s, { type: 'RESUME', now: T0 })).toBe(s);
    expect(sessionReducer(idleState, { type: 'PAUSE', now: T0 })).toBe(idleState);
    expect(sessionReducer(idleState, { type: 'TICK', now: T0 })).toBe(idleState);
    expect(sessionReducer(idleState, { type: 'END_EARLY', now: T0 })).toBe(idleState);
    expect(sessionReducer(idleState, { type: 'CLOCK_SHIFT', deltaMs: 5000 })).toBe(idleState);
    expect(sessionReducer(s, { type: 'CLOCK_SHIFT', deltaMs: 0 })).toBe(s);
  });

  it('END_EARLY while running credits practiced time, excluding pauses', () => {
    let s = sessionReducer(start(), { type: 'PAUSE', now: T0 + 60_000 });
    s = sessionReducer(s, { type: 'RESUME', now: T0 + 90_000 });
    s = sessionReducer(s, { type: 'END_EARLY', now: T0 + 150_500 });
    expect(s).toMatchObject({ status: 'ended', practicedSec: 120, endedAt: T0 + 150_500 });
  });

  it('END_EARLY while paused ends at the pause moment', () => {
    let s = sessionReducer(start(), { type: 'PAUSE', now: T0 + 240_000 });
    s = sessionReducer(s, { type: 'END_EARLY', now: T0 + 900_000 });
    expect(s).toMatchObject({ status: 'ended', practicedSec: 240, endedAt: T0 + 240_000 });
  });

  it('END_EARLY after endsAt counts as completed', () => {
    expect(sessionReducer(start(), { type: 'END_EARLY', now: T0 + 601_000 }).status).toBe('completed');
  });

  it('CLOCK_SHIFT moves running and paused timestamps together', () => {
    const running = sessionReducer(start(), { type: 'CLOCK_SHIFT', deltaMs: 3_600_000 });
    expect(running).toMatchObject({ startedAt: T0 + 3_600_000, endsAt: T0 + 4_200_000 });

    const paused = sessionReducer(sessionReducer(start(), { type: 'PAUSE', now: T0 + 1000 }), {
      type: 'CLOCK_SHIFT',
      deltaMs: -5000,
    });
    expect(paused).toMatchObject({ startedAt: T0 - 5000, pausedAt: T0 - 4000 });

    const done = sessionReducer(start(), { type: 'TICK', now: T0 + 600_000 });
    expect(sessionReducer(done, { type: 'CLOCK_SHIFT', deltaMs: 1 })).toBe(done);
  });

  it('clamps practiced time to [0, planned]', () => {
    const weird: SessionState = { status: 'paused', mudraId: 'gyan', plannedSec: 60, startedAt: T0, remainingMs: 0, pausedAt: T0 + 120_000, pausedTotalMs: 0 };
    expect(sessionReducer(weird, { type: 'END_EARLY', now: T0 })).toMatchObject({ practicedSec: 60 });
  });

  it('RESTORE and RESET', () => {
    const s = start();
    expect(sessionReducer(idleState, { type: 'RESTORE', state: s })).toBe(s);
    expect(sessionReducer(s, { type: 'RESET' })).toBe(idleState);
  });

  it('elapsed/remaining for terminal and idle states', () => {
    const done = sessionReducer(start(), { type: 'TICK', now: T0 + 600_000 });
    expect(elapsedMs(done, 0)).toBe(600_000);
    expect(remainingMs(done, 0)).toBe(0);
    expect(elapsedMs(idleState, 0)).toBe(0);
  });
});
