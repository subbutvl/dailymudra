import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { View } from 'react-native';
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

import { useI18n } from '@/i18n/useI18n';

export const INHALE_MS = 4000;
export const EXHALE_MS = 6000;

interface Props {
  running: boolean;
  size: number;
  color: string;
  ringColor: string;
  haptics?: boolean;
}

/**
 * Breath pacing: a soft disc inside a thin ring that grows for 4 s (inhale)
 * and shrinks for 6 s (exhale). No text. Runs on the UI thread.
 * With "Remove animations" on, the disc stays still.
 */
export function BreathCue({ running, size, color, ringColor, haptics = false }: Props) {
  const reduceMotion = useReducedMotion();
  const { t } = useI18n();
  const scale = useSharedValue(0.55);

  // Optional haptic tap at each phase change (no React renders).
  useEffect(() => {
    if (!running || !haptics) return;
    let timer: ReturnType<typeof setTimeout>;
    const tap = (inhale: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      timer = setTimeout(() => tap(!inhale), inhale ? INHALE_MS : EXHALE_MS);
    };
    tap(true);
    return () => clearTimeout(timer);
  }, [running, haptics]);

  useEffect(() => {
    if (!running || reduceMotion) {
      cancelAnimation(scale);
      scale.value = withTiming(reduceMotion ? 0.8 : 0.55, { duration: reduceMotion ? 0 : 400 });
      return;
    }
    const ease = Easing.inOut(Easing.sin);
    scale.value = 0.55;
    scale.value = withRepeat(
      withSequence(withTiming(1, { duration: INHALE_MS, easing: ease }), withTiming(0.55, { duration: EXHALE_MS, easing: ease })),
      -1,
    );
    return () => cancelAnimation(scale);
  }, [running, reduceMotion, scale]);

  const discStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 0.3 + (scale.value - 0.55) * 0.75,
  }));

  return (
    <View
      accessible
      accessibilityLabel={running ? t('breathGuide') : t('breathPaused')}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: ringColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View style={[{ width: size - 8, height: size - 8, borderRadius: size, backgroundColor: color }, discStyle]} />
    </View>
  );
}
