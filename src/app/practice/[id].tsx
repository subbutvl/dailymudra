import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { getMudra, type Mudra } from '@/content/mudras';
import { MudraImage } from '@/features/library/MudraImage';
import { useProgress } from '@/features/progress/useProgress';
import { BreathCue } from '@/features/session/BreathCue';
import { readCheckpoint } from '@/features/session/checkpoint';
import { MIN_CREDITED_SEC } from '@/features/progress/sessionRepo';
import { type SessionState } from '@/features/session/sessionReducer';
import { useSessionTimer } from '@/features/session/useSessionTimer';
import { useI18n } from '@/i18n/useI18n';
import { formatClock, remainingParts } from '@/lib/time';
import { useSettings } from '@/settings/useSettings';
import { useTheme } from '@/theme/useTheme';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { IconButton } from '@/ui/IconButton';
import { Screen } from '@/ui/Screen';

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
  const { t, mudra: text } = useI18n();
  const showImage = useSettings((s) => s.showImageInPractice);
  const breathTaps = useSettings((s) => s.breathTaps);
  const timer = useSessionTimer({
    mudraId: mudra.id,
    plannedSec,
    restored,
    notification: { title: t('sessionComplete'), body: `${text(mudra).name} · ${t('minutes', { n: Math.round(plannedSec / 60) })}` },
  });
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
  const parts = remainingParts(timer.remainingMs);
  const spoken =
    parts.m > 0 && parts.s > 0 ? t('spokenMinSec', parts) : parts.m > 0 ? t('spokenMin', parts) : t('spokenSec', parts);

  return (
    <Screen night>
      <StatusBar hidden />
      <View style={[styles.topBar, { paddingHorizontal: space.sm }]}>
        <IconButton glyph="✕" label={t('endSession')} color={color.nightText} onPress={() => setConfirmEnd(true)} />
        <AppText variant="h2" style={{ color: color.nightText, paddingRight: space.lg }} numberOfLines={1}>
          {text(mudra).name}
        </AppText>
      </View>

      {/* Hero: the gesture takes all the space the compact controls leave (~75%). */}
      <Animated.View entering={FadeIn.duration(500)} style={[styles.hero, { paddingHorizontal: space.lg }]}>
        {showImage ? (
          <MudraImage mudra={mudra} size="100%" height="100%" dark glyphSize={140} />
        ) : (
          <AppText variant="h1" style={{ color: color.nightText, textAlign: 'center' }}>
            {text(mudra).name}
          </AppText>
        )}
      </Animated.View>

      {/* Compact controls: breath ring · time left · pause/play */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(150)}
        style={[styles.controls, { paddingHorizontal: space.gutter, paddingVertical: space.lg, gap: space.md }]}
      >
        <BreathCue running={state.status === 'running'} size={64} color={color.surface} ringColor={color.nightMuted} haptics={breathTaps} />
        <AppText
          variant="body"
          style={{ flex: 1, color: color.nightMuted, fontVariant: ['tabular-nums'] }}
          accessibilityLabel={spoken}
          numberOfLines={1}
        >
          {t('timeLeft', { time: formatClock(timer.remainingMs) })}
        </AppText>
        {state.status === 'paused' ? (
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <RoundButton glyph="■" label={t('end')} onPress={timer.endEarly} />
            <RoundButton glyph="▶" label={t('resume')} onPress={timer.resume} filled />
          </View>
        ) : (
          <RoundButton glyph="❚❚" label={t('pause')} onPress={timer.pause} />
        )}
      </Animated.View>

      <Modal visible={confirmEnd} transparent animationType="fade" onRequestClose={() => setConfirmEnd(false)}>
        <View style={styles.scrim}>
          <View style={[styles.sheet, { backgroundColor: color.nightSurface, padding: space.xl, gap: space.lg }]}>
            <AppText variant="h2" style={{ color: color.nightText }}>
              {t('endSessionQ')}
            </AppText>
            <AppText style={{ color: color.nightMuted }}>
              {practicedMin >= 1 ? t('practicedSoFar', { n: practicedMin }) : t('tooShort')}
            </AppText>
            <Button label={t('keepGoing')} onNight onPress={() => setConfirmEnd(false)} />
            <Button
              label={t('endSession')}
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
    </Screen>
  );
}

function RoundButton({ glyph, label, onPress, filled }: { glyph: string; label: string; onPress: () => void; filled?: boolean }) {
  const { color } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        {
          backgroundColor: filled ? color.surface : color.nightSurface,
          borderColor: color.nightMuted,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
    >
      <AppText variant="h2" style={{ color: filled ? color.night : color.nightText }}>
        {glyph}
      </AppText>
    </Pressable>
  );
}

function Completion({ mudra, practicedSec, onAgain }: { mudra: Mudra; practicedSec: number; onAgain: () => void }) {
  const { color, space } = useTheme();
  const { t, mudra: text } = useI18n();
  const { streak, totalMin } = useProgress();
  const minutes = Math.max(1, Math.round(practicedSec / 60));
  return (
    <Screen night>
      <StatusBar style="light" />
      <View style={[styles.completion, { padding: space.gutter, gap: space.lg }]}>
        <Animated.View entering={ZoomIn.duration(500)}>
          <AppText variant="display" style={{ color: color.surface }} importantForAccessibility="no">
            ✓
          </AppText>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(500).delay(150)} style={{ alignItems: 'center', gap: space.lg }}>
          <AppText variant="h1" style={{ color: color.nightText, textAlign: 'center' }} accessibilityRole="header">
            {t('completionTitle', { n: minutes, name: text(mudra).name })}
          </AppText>
          <View style={[styles.statPill, { backgroundColor: color.warm }]}>
            <AppText variant="bodyStrong">{t('completionStats', { streak, total: totalMin })}</AppText>
          </View>
          <AppText style={{ color: color.nightMuted, textAlign: 'center' }}>{t('takeAMoment')}</AppText>
        </Animated.View>
      </View>
      <Animated.View entering={FadeIn.duration(500).delay(350)} style={{ padding: space.gutter, gap: space.sm }}>
        <Button label={t('done')} onNight onPress={() => router.dismissTo('/')} />
        <Button label={t('practiceAgain')} kind="text" onNight onPress={onAgain} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center' },
  round: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  completion: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statPill: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
});
