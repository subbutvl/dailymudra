import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/ui/AppText';

export const INHALE_MS = 4000;
export const EXHALE_MS = 6000;

interface Props {
  running: boolean;
  size: number;
  color: string;
  textColor: string;
  haptics?: boolean;
}

/**
 * The only animation in the app (docs/SPEC.md C1a): a soft circle that grows
 * for 4 s (inhale) and shrinks for 6 s (exhale). Runs on the UI thread.
 * With "Remove animations" on, it is a still circle with the label switching.
 */
export function BreathCue({ running, size, color, textColor, haptics = false }: Props) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(0.6);
  const [phase, setPhase] = useState<'Inhale' | 'Exhale'>('Inhale');

  // Label + optional haptic tap on the same 4/6 rhythm (one React render per phase).
  useEffect(() => {
    if (!running) return;
    let timer: ReturnType<typeof setTimeout>;
    const go = (next: 'Inhale' | 'Exhale') => {
      setPhase(next);
      if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      timer = setTimeout(() => go(next === 'Inhale' ? 'Exhale' : 'Inhale'), next === 'Inhale' ? INHALE_MS : EXHALE_MS);
    };
    go('Inhale');
    return () => clearTimeout(timer);
  }, [running, haptics]);

  useEffect(() => {
    if (!running || reduceMotion) {
      cancelAnimation(scale);
      scale.value = reduceMotion ? 0.85 : 0.6;
      return;
    }
    const ease = Easing.inOut(Easing.sin);
    scale.value = 0.6;
    scale.value = withRepeat(
      withSequence(withTiming(1, { duration: INHALE_MS, easing: ease }), withTiming(0.6, { duration: EXHALE_MS, easing: ease })),
      -1,
    );
    return () => cancelAnimation(scale);
  }, [running, reduceMotion, scale]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 0.35 + (scale.value - 0.6) * 0.625,
  }));

  return (
    <View style={styles.row} accessible accessibilityLabel={running ? `Breath cue: ${phase}` : 'Breath cue paused'}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, circleStyle]}
        />
      </View>
      <AppText variant="bodyStrong" style={{ color: textColor, minWidth: 72 }}>
        {running ? phase : 'Paused'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
});
