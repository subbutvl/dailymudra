import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useI18n } from '@/i18n/useI18n';
import { announce } from '@/lib/a11y';
import { useProgress } from '@/features/progress/useProgress';
import { saveSession } from '@/features/progress/sessionRepo';
import { useSettings } from '@/settings/useSettings';
import { clearCheckpoint, writeCheckpoint } from './checkpoint';
import { cancelEnd, scheduleEnd } from './notifications';
import { idleState, remainingMs, sessionReducer, type SessionState } from './sessionReducer';

const KEEP_AWAKE_TAG = 'practice';
const CHECKPOINT_EVERY_MS = 15_000;
const CLOCK_JUMP_MS = 2_000;

interface Options {
  mudraId: string;
  plannedSec: number;
  /** State recovered from a checkpoint; when absent the session starts now. */
  restored?: SessionState;
  /** Localized text for the end-of-session notification. */
  notification: { title: string; body: string };
}

/**
 * Wires the pure reducer to the clock, AppState, keep-awake, the end
 * notification and persistence (docs/SPEC.md §3.3). Re-renders once per second.
 */
export function useSessionTimer({ mudraId, plannedSec, restored, notification }: Options) {
  const { t } = useI18n();
  const notificationRef = useRef(notification);
  useEffect(() => {
    notificationRef.current = notification;
  });
  const [state, dispatch] = useReducer(sessionReducer, idleState);
  const [now, setNow] = useState(() => Date.now());
  const saved = useRef(false);
  const appStateRef = useRef<'active' | 'background'>('active');
  const hapticsOn = useSettings((s) => s.hapticsOnComplete);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Start (or restore) once.
  useEffect(() => {
    if (restored) dispatch({ type: 'RESTORE', state: restored });
    else dispatch({ type: 'START', mudraId, plannedSec, now: Date.now() });
  }, [mudraId, plannedSec, restored]);

  // 1 s clock aligned to whole seconds of remaining time, with the clock-change guard.
  useEffect(() => {
    if (state.status !== 'running') return;
    let lastWall = Date.now();
    let lastMono = performance.now();
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const wall = Date.now();
      const mono = performance.now();
      const drift = wall - lastWall - (mono - lastMono);
      if (Math.abs(drift) > CLOCK_JUMP_MS && appStateRef.current === 'active') {
        dispatch({ type: 'CLOCK_SHIFT', deltaMs: drift });
      }
      lastWall = wall;
      lastMono = mono;
      setNow(wall);
      dispatch({ type: 'TICK', now: wall });
      const msToNextSecond = (state.endsAt - wall) % 1000 || 1000;
      timer = setTimeout(tick, Math.max(50, msToNextSecond));
    };
    timer = setTimeout(tick, 0);
    return () => clearTimeout(timer);
  }, [state]);

  // Keep the screen awake only while running.
  useEffect(() => {
    if (state.status === 'running') {
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
      return () => {
        deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
      };
    }
  }, [state.status]);

  // End notification follows the running state.
  useEffect(() => {
    if (state.status === 'running') {
      scheduleEnd(state.endsAt, notificationRef.current.title, notificationRef.current.body);
    } else if (state.status !== 'idle') {
      cancelEnd();
    }
  }, [state.status, state.status === 'running' ? state.endsAt : 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Checkpoint on every transition and every 15 s while running.
  useEffect(() => {
    writeCheckpoint(state, appStateRef.current);
    if (state.status !== 'running') return;
    const id = setInterval(() => writeCheckpoint(state, appStateRef.current), CHECKPOINT_EVERY_MS);
    return () => clearInterval(id);
  }, [state]);

  // AppState: refresh the clock on return; checkpoint as "background" on leave.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      appStateRef.current = next === 'active' ? 'active' : 'background';
      writeCheckpoint(stateRef.current, appStateRef.current);
      if (next === 'active') {
        const t = Date.now();
        setNow(t);
        dispatch({ type: 'TICK', now: t });
      }
    });
    return () => sub.remove();
  }, []);

  // Finish: save once, refresh stats, haptic + announcement.
  useEffect(() => {
    if ((state.status !== 'completed' && state.status !== 'ended') || saved.current) return;
    saved.current = true;
    clearCheckpoint();
    saveSession({
      mudraId: state.mudraId,
      startedAt: state.startedAt,
      endedAt: state.endedAt,
      plannedSec: state.plannedSec,
      practicedSec: state.practicedSec,
      completed: state.status === 'completed',
    });
    useProgress.getState().refresh();
    if (state.status === 'completed') {
      if (hapticsOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      announce(t('sessionComplete'));
    }
  }, [state, hapticsOn, t]);

  // Whole-minute announcement for TalkBack (not a live region every second).
  const remaining = remainingMs(state, now);
  const lastAnnounced = useRef<number | null>(null);
  useEffect(() => {
    if (state.status !== 'running') return;
    const minutesLeft = Math.ceil(remaining / 60000);
    if (lastAnnounced.current !== null && minutesLeft !== lastAnnounced.current && minutesLeft > 0) {
      announce(t('spokenMin', { m: minutesLeft }));
    }
    lastAnnounced.current = minutesLeft;
  }, [remaining, state.status, t]);

  const pause = useCallback(() => dispatch({ type: 'PAUSE', now: Date.now() }), []);
  const resume = useCallback(() => {
    const t = Date.now();
    setNow(t);
    dispatch({ type: 'RESUME', now: t });
  }, []);
  const endEarly = useCallback(() => dispatch({ type: 'END_EARLY', now: Date.now() }), []);
  const restart = useCallback(() => {
    saved.current = false;
    const t = Date.now();
    setNow(t);
    dispatch({ type: 'START', mudraId, plannedSec, now: t });
  }, [mudraId, plannedSec]);

  return { state, remainingMs: remaining, pause, resume, endEarly, restart };
}
