/**
 * Pure session state machine (docs/SPEC.md §1.2). Timestamp based: remaining
 * time is always derived from `endsAt - now`, never decremented.
 */

interface Base {
  mudraId: string;
  plannedSec: number;
  startedAt: number;
}

export type SessionState =
  | { status: 'idle' }
  | (Base & { status: 'running'; endsAt: number; pausedTotalMs: number })
  | (Base & { status: 'paused'; remainingMs: number; pausedAt: number; pausedTotalMs: number })
  | (Base & { status: 'completed'; practicedSec: number; endedAt: number })
  | (Base & { status: 'ended'; practicedSec: number; endedAt: number });

export type SessionEvent =
  | { type: 'START'; mudraId: string; plannedSec: number; now: number }
  | { type: 'PAUSE'; now: number }
  | { type: 'RESUME'; now: number }
  | { type: 'TICK'; now: number }
  | { type: 'CLOCK_SHIFT'; deltaMs: number }
  | { type: 'END_EARLY'; now: number }
  | { type: 'RESTORE'; state: SessionState }
  | { type: 'RESET' };

export const idleState: SessionState = { status: 'idle' };

const clampSec = (sec: number, plannedSec: number) =>
  Math.max(0, Math.min(plannedSec, Math.floor(sec)));

/** Milliseconds actually practiced so far (excludes paused time). */
export function elapsedMs(state: SessionState, now: number): number {
  switch (state.status) {
    case 'running':
      return Math.max(0, Math.min(now, state.endsAt) - state.startedAt - state.pausedTotalMs);
    case 'paused':
      return Math.max(0, state.pausedAt - state.startedAt - state.pausedTotalMs);
    case 'completed':
    case 'ended':
      return state.practicedSec * 1000;
    default:
      return 0;
  }
}

export function remainingMs(state: SessionState, now: number): number {
  switch (state.status) {
    case 'running':
      return Math.max(0, state.endsAt - now);
    case 'paused':
      return state.remainingMs;
    default:
      return 0;
  }
}

export function sessionReducer(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case 'START':
      return {
        status: 'running',
        mudraId: event.mudraId,
        plannedSec: event.plannedSec,
        startedAt: event.now,
        endsAt: event.now + event.plannedSec * 1000,
        pausedTotalMs: 0,
      };

    case 'PAUSE':
      if (state.status !== 'running') return state;
      if (event.now >= state.endsAt) return complete(state);
      return {
        status: 'paused',
        mudraId: state.mudraId,
        plannedSec: state.plannedSec,
        startedAt: state.startedAt,
        remainingMs: state.endsAt - event.now,
        pausedAt: event.now,
        pausedTotalMs: state.pausedTotalMs,
      };

    case 'RESUME':
      if (state.status !== 'paused') return state;
      return {
        status: 'running',
        mudraId: state.mudraId,
        plannedSec: state.plannedSec,
        startedAt: state.startedAt,
        endsAt: event.now + state.remainingMs,
        pausedTotalMs: state.pausedTotalMs + Math.max(0, event.now - state.pausedAt),
      };

    case 'TICK':
      if (state.status === 'running' && event.now >= state.endsAt) return complete(state);
      return state;

    case 'CLOCK_SHIFT':
      if (event.deltaMs === 0) return state;
      if (state.status === 'running') {
        return { ...state, startedAt: state.startedAt + event.deltaMs, endsAt: state.endsAt + event.deltaMs };
      }
      if (state.status === 'paused') {
        return { ...state, startedAt: state.startedAt + event.deltaMs, pausedAt: state.pausedAt + event.deltaMs };
      }
      return state;

    case 'END_EARLY': {
      if (state.status !== 'running' && state.status !== 'paused') return state;
      if (state.status === 'running' && event.now >= state.endsAt) return complete(state);
      return {
        status: 'ended',
        mudraId: state.mudraId,
        plannedSec: state.plannedSec,
        startedAt: state.startedAt,
        practicedSec: clampSec(elapsedMs(state, event.now) / 1000, state.plannedSec),
        endedAt: state.status === 'paused' ? state.pausedAt : event.now,
      };
    }

    case 'RESTORE':
      return event.state;

    case 'RESET':
      return idleState;
  }
}

function complete(state: Extract<SessionState, { status: 'running' }>): SessionState {
  return {
    status: 'completed',
    mudraId: state.mudraId,
    plannedSec: state.plannedSec,
    startedAt: state.startedAt,
    practicedSec: state.plannedSec,
    endedAt: state.endsAt,
  };
}
