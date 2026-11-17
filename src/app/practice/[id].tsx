import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler, Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMudra, type Mudra } from '@/content/mudras';
import { MudraImage } from '@/features/library/MudraImage';
import { useProgress } from '@/features/progress/useProgress';
import { BreathCue } from '@/features/session/BreathCue';
import { readCheckpoint } from '@/features/session/checkpoint';
import { MIN_CREDITED_SEC } from '@/features/progress/sessionRepo';
import { type SessionState } from '@/features/session/sessionReducer';
import { useSessionTimer } from '@/features/session/useSessionTimer';
import { formatClock, spokenRemaining } from '@/lib/time';
import { useSettings } from '@/settings/useSettings';
import { useTheme } from '@/theme/useTheme';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { IconButton } from '@/ui/IconButton';

/**
 * Active Practice (dark). Per the wireframe feedback the gesture image is the
 * hero (~70% of the screen) because practice is eyes-open. Below it: a small
 * breath circle, a subtle time-left label and pause/play. No big dial.
 * Completion swaps in place on the same screen.
 */
export default function Practice() {
  const params = useLocalSearchParams<{ id: string; minutes?: string; resume?: string }>();
  const mudra = getMudra(params.id);
  const [restored] = useState<SessionState | undefined>(() => {
    if (params.resume !== '1') return undefined;
    const cp = readCheckpoint();
    return cp && cp.state.mudraId === params.id ? cp.state : undefined;
  });
  const plannedSec =
    restored && restored.status !== 'idle' ? restored.plannedSec : Math.max(1, Number(params.minutes ?? mudra?.suggestedMinutes ?? 10)) * 60;

  if (!mudra) return <Redirect href="/" />;
  return <PracticeBody mudra={mudra} plannedSec={plannedSec} restored={restored} />;
}

function PracticeBody({ mudra, plannedSec, restored }: { mudra: Mudra; plannedSec: number; restored?: SessionState }) {
  const { color, space } = useTheme();
  const { height } = useWindowDimensions();
  const showImage = useSettings((s) => s.showImageInPractice);
  const breathTaps = useSettings((s) => s.breathTaps);
  const timer = useSessionTimer({ mudraId: mudra.id, plannedSec, restored });
  const { state } = timer;
  const [confirmEnd, setConfirmEnd] = useState(false);

  const active = state.status === 'running' || state.status === 'paused';

  // Hardware back while practicing opens the confirm sheet instead of leaving.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (active) {
        setConfirmEnd(true);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [active]);

  // Sessions under a minute go straight back with no Completion screen.
  useEffect(() => {
    if (state.status === 'ended' && state.practicedSec < MIN_CREDITED_SEC) router.back();
  }, [state]);

  if (state.status === 'completed' || (state.status === 'ended' && state.practicedSec >= MIN_CREDITED_SEC)) {
    return <Completion mudra={mudra} practicedSec={state.practicedSec} onAgain={timer.restart} />;
  }

  // Remaining time already excludes pauses, so practiced = planned - remaining.
  const practicedMin = Math.floor((plannedSec * 1000 - timer.remainingMs) / 60000);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.night }}>
      <StatusBar hidden />
      <View style={[styles.topBar, { paddingHorizontal: space.sm }]}>
        <IconButton glyph="✕" label="End session" color={color.nightText} onPress={() => setConfirmEnd(true)} />
        <AppText variant="h2" style={{ color: color.nightText, paddingRight: space.lg }}>
          {mudra.name.replace(' Mudra', '')}
        </AppText>
      </View>

      {/* Hero: the gesture, ~70% of the screen. */}
      <View style={{ height: height * 0.62, paddingHorizontal: space.lg, alignItems: 'center', justifyContent: 'center' }}>
        {showImage ? (
          <MudraImage mudra={mudra} size="100%" height="100%" dark glyphSize={120} />
        ) : (
          <AppText variant="h1" style={{ color: color.nightText }}>
            {mudra.name}
          </AppText>
        )}
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottom, { paddingHorizontal: space.gutter }]}>
        <BreathCue
          running={state.status === 'running'}
          size={56}
          color={color.surface}
          textColor={color.nightText}
          haptics={breathTaps}
        />
        <View style={styles.controlsRow}>
          <AppText
            variant="body"
            style={{ color: color.nightMuted, fontVariant: ['tabular-nums'] }}
            accessibilityLabel={spokenRemaining(timer.remainingMs)}
          >
            {formatClock(timer.remainingMs)} left
          </AppText>
          {state.status === 'paused' ? (
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button label="End" kind="secondary" onNight onPress={timer.endEarly} />
              <Button label="▶ Resume" onNight onPress={timer.resume} accessibilityLabel="Resume" />
            </View>
          ) : (
            <Button label="❚❚ Pause" kind="secondary" onNight onPress={timer.pause} accessibilityLabel="Pause" />
          )}
        </View>
      </View>

      <Modal visible={confirmEnd} transparent animationType="none" onRequestClose={() => setConfirmEnd(false)}>
        <View style={styles.scrim}>
          <View style={[styles.sheet, { backgroundColor: color.nightSurface, padding: space.xl, gap: space.lg }]}>
            <AppText variant="h2" style={{ color: color.nightText }}>
              End session?
            </AppText>
            <AppText style={{ color: color.nightMuted }}>
              {practicedMin >= 1 ? `You've practiced ${practicedMin} min.` : 'Less than a minute so far, so it will not be saved.'}
            </AppText>
            <Button label="Keep going" onNight onPress={() => setConfirmEnd(false)} />
            <Button
              label="End session"
              kind="secondary"
              onNight
              onPress={() => {
                setConfirmEnd(false);
                timer.endEarly();
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Completion({ mudra, practicedSec, onAgain }: { mudra: Mudra; practicedSec: number; onAgain: () => void }) {
  const { color, space } = useTheme();
  const { streak, totalMin } = useProgress();
  const minutes = Math.max(1, Math.round(practicedSec / 60));
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.night }}>
      <StatusBar style="light" />
      <View style={[styles.completion, { padding: space.gutter, gap: space.lg }]}>
        <AppText variant="display" style={{ color: color.surface }} importantForAccessibility="no">
          ✓
        </AppText>
        <AppText variant="h1" style={{ color: color.nightText, textAlign: 'center' }} accessibilityRole="header">
          {minutes} minute{minutes === 1 ? '' : 's'} of {mudra.name.replace(' Mudra', '')}
        </AppText>
        <View style={[styles.statPill, { backgroundColor: color.warm }]}>
          <AppText variant="bodyStrong">
            {streak}-day streak · {totalMin} min total
          </AppText>
        </View>
        <AppText style={{ color: color.nightMuted }}>Take a moment before you move.</AppText>
      </View>
      <View style={{ padding: space.gutter, gap: space.sm }}>
        <Button label="Done" onNight onPress={() => router.dismissTo('/')} />
        <Button label="Practice again" kind="text" onNight onPress={onAgain} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bottom: { flex: 1, justifyContent: 'space-evenly' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  completion: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statPill: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
});
