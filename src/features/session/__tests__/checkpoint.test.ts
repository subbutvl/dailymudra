import { recover, type Checkpoint } from '../checkpoint';

jest.mock('@/db/kv', () => ({ kvGet: jest.fn(), kvSet: jest.fn(), kvRemove: jest.fn() }));

const T0 = 1_700_000_000_000;
const running: Checkpoint['state'] = { status: 'running', mudraId: 'gyan', plannedSec: 600, startedAt: T0, endsAt: T0 + 600_000, pausedTotalMs: 0 };

describe('recover', () => {
  it('does nothing without a checkpoint', () => {
    expect(recover(null, T0)).toEqual({ kind: 'none' });
  });

  it('killed in background after endsAt: completed with full credit', () => {
    const r = recover({ state: running, elapsedMs: 100_000, checkpointAt: T0 + 100_000, appState: 'background' }, T0 + 900_000);
    expect(r).toMatchObject({ kind: 'finished', record: { completed: true, practicedSec: 600, endedAt: T0 + 600_000 } });
  });

  it('killed in background before endsAt: resumes', () => {
    const r = recover({ state: running, elapsedMs: 100_000, checkpointAt: T0 + 100_000, appState: 'background' }, T0 + 200_000);
    expect(r).toEqual({ kind: 'resume', state: running });
  });

  it('crash in foreground: credits only checkpointed time as ended', () => {
    const r = recover({ state: running, elapsedMs: 245_000, checkpointAt: T0 + 245_000, appState: 'active' }, T0 + 900_000);
    expect(r).toMatchObject({ kind: 'finished', record: { completed: false, practicedSec: 245, endedAt: T0 + 245_000 } });
  });

  it('paused session resumes as paused', () => {
    const paused: Checkpoint['state'] = { status: 'paused', mudraId: 'gyan', plannedSec: 600, startedAt: T0, remainingMs: 1, pausedAt: T0, pausedTotalMs: 0 };
    expect(recover({ state: paused, elapsedMs: 0, checkpointAt: T0, appState: 'active' }, T0 + 1)).toEqual({ kind: 'resume', state: paused });
  });
});
