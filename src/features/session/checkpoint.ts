import { kvGet, kvRemove, kvSet } from '@/db/kv';
import { elapsedMs, type SessionState } from './sessionReducer';

/**
 * In-flight session checkpoint (docs/SPEC.md §1.2), so a session survives the
 * process being killed in the background, and a crash credits only checkpointed time.
 */
const KEY = 'session.inflight';

export interface Checkpoint {
  state: Extract<SessionState, { status: 'running' } | { status: 'paused' }>;
  elapsedMs: number;
  checkpointAt: number;
  /** 'background' when the app went to the background, 'active' otherwise. */
  appState: 'active' | 'background';
}

export function writeCheckpoint(state: SessionState, appState: Checkpoint['appState'], now = Date.now()) {
  if (state.status !== 'running' && state.status !== 'paused') {
    kvRemove(KEY);
    return;
  }
  const cp: Checkpoint = { state, elapsedMs: elapsedMs(state, now), checkpointAt: now, appState };
  kvSet(KEY, cp);
}

export function readCheckpoint(): Checkpoint | null {
  return kvGet<Checkpoint | null>(KEY, null);
}

export function clearCheckpoint() {
  kvRemove(KEY);
}

export type Recovery =
  | { kind: 'none' }
  /** Practice should reopen and continue (or show paused) from this state. */
  | { kind: 'resume'; state: Checkpoint['state'] }
  /** Session is over; save this record. */
  | {
      kind: 'finished';
      record: { mudraId: string; startedAt: number; endedAt: number; plannedSec: number; practicedSec: number; completed: boolean };
    };

/** Decides what to do with a checkpoint found at launch. Pure, so it is unit tested. */
export function recover(cp: Checkpoint | null, now: number): Recovery {
  if (!cp) return { kind: 'none' };
  const s = cp.state;
  if (s.status === 'paused') return { kind: 'resume', state: s };

  if (now >= s.endsAt && cp.appState === 'background') {
    return {
      kind: 'finished',
      record: { mudraId: s.mudraId, startedAt: s.startedAt, endedAt: s.endsAt, plannedSec: s.plannedSec, practicedSec: s.plannedSec, completed: true },
    };
  }
  if (cp.appState === 'background') return { kind: 'resume', state: s };

  // The app died while in the foreground: credit only checkpointed time.
  const practicedSec = Math.min(s.plannedSec, Math.floor(cp.elapsedMs / 1000));
  return {
    kind: 'finished',
    record: { mudraId: s.mudraId, startedAt: s.startedAt, endedAt: cp.checkpointAt, plannedSec: s.plannedSec, practicedSec, completed: false },
  };
}
