import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { DURATION_PRESETS, getMudra, MAX_MINUTES, MIN_MINUTES, type Mudra } from '@/content/mudras';
import { ElementPills } from '@/features/library/ElementTags';
import { MudraImage } from '@/features/library/MudraImage';
import { ensurePermission } from '@/features/session/notifications';
import { useI18n } from '@/i18n/useI18n';
import { useSettings } from '@/settings/useSettings';
import { useTheme } from '@/theme/useTheme';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { IconButton } from '@/ui/IconButton';
import { Screen } from '@/ui/Screen';

const FLIP_MS = 450;

/**
 * Mudra Detail as a flip card. Front: the gesture image. Back: "How to form it"
 * and traditional associations, scrollable inside the card when long.
 * The duration picker and Start button stay in a sticky footer.
 */
export default function MudraDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mudra = getMudra(id);
  const { space } = useTheme();
  const { t } = useI18n();

  if (!mudra) {
    return (
      <Screen style={{ padding: space.gutter }}>
        <AppText>{t('notFound')}</AppText>
        <Button label={t('back')} kind="text" onPress={() => router.back()} />
      </Screen>
    );
  }
  return <DetailBody mudra={mudra} />;
}

function DetailBody({ mudra }: { mudra: Mudra }) {
  const { color, space, radius } = useTheme();
  const { t, mudra: text } = useI18n();
  const m = text(mudra);
  const remembered = useSettings((s) => s.durations[mudra.id]);
  const setDuration = useSettings((s) => s.setDuration);
  const minutes = remembered ?? mudra.suggestedMinutes;
  const [showSteps, setShowSteps] = useState(false);
  const reduceMotion = useReducedMotion();

  // 0 = front (image), 1 = back (steps).
  const flip = useSharedValue(0);
  useEffect(() => {
    flip.value = withTiming(showSteps ? 1 : 0, {
      duration: reduceMotion ? 0 : FLIP_MS,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [showSteps, reduceMotion, flip]);

  const frontStyle = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 1 : 0,
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    opacity: flip.value >= 0.5 ? 1 : 0,
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` }],
  }));

  const pick = (n: number) => setDuration(mudra.id, Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, n)));

  const start = async () => {
    await ensurePermission();
    router.push({ pathname: '/practice/[id]', params: { id: mudra.id, minutes: String(minutes) } });
  };

  const toggle = () => setShowSteps((v) => !v);
  const cardStyle = [styles.face, { backgroundColor: color.surface, borderRadius: radius.card }];

  return (
    <Screen>
      <View style={[styles.topBar, { paddingHorizontal: space.sm }]}>
        <IconButton glyph="‹" label={t('back')} color={color.accent} onPress={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: space.xl, gap: space.lg }}>
        <View style={styles.card}>
          <Animated.View
            style={[cardStyle, frontStyle]}
            pointerEvents={showSteps ? 'none' : 'auto'}
            importantForAccessibility={showSteps ? 'no-hide-descendants' : 'auto'}
            accessibilityElementsHidden={showSteps}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('showHow')}
              accessibilityHint={t('flipsCard')}
              onPress={toggle}
              style={styles.fill}
            >
              <MudraImage mudra={mudra} size="100%" glyphSize={96} />
            </Pressable>
          </Animated.View>
          <Animated.View
            style={[cardStyle, backStyle]}
            pointerEvents={showSteps ? 'auto' : 'none'}
            importantForAccessibility={showSteps ? 'auto' : 'no-hide-descendants'}
            accessibilityElementsHidden={!showSteps}
          >
            <CardBack mudra={mudra} />
          </Animated.View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showSteps ? t('showGesture') : t('showHow')}
          onPress={toggle}
          style={styles.flipLink}
          hitSlop={8}
        >
          <AppText variant="bodyStrong" style={{ color: color.accent }}>
            {showSteps ? t('flipToGesture') : t('flipToHow')}
          </AppText>
        </Pressable>

        <Animated.View entering={FadeInDown.duration(380)} style={{ gap: 4 }}>
          <AppText variant="h1" accessibilityRole="header">
            {m.name}
          </AppText>
          <AppText muted>
            {mudra.sanskrit} · {m.meaning}
          </AppText>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(380).delay(80)} style={{ gap: space.sm }}>
          <AppText variant="overline" muted>
            {t('elements')}
          </AppText>
          <ElementPills mudra={mudra} />
        </Animated.View>

        {m.cautions && (
          <AppText variant="caption" muted>
            ⓘ {m.cautions}
          </AppText>
        )}
      </ScrollView>

      {/* Sticky footer */}
      <View style={[styles.footer, { backgroundColor: color.bg, borderTopColor: color.accentMuted, padding: space.lg, gap: space.md }]}>
        <View style={styles.durationRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {DURATION_PRESETS.map((p) => (
              <Chip key={p} label={`${p}`} selected={minutes === p} onPress={() => pick(p)} accessibilityLabel={t('minutes', { n: p })} />
            ))}
          </ScrollView>
          <View style={styles.stepper}>
            <IconButton glyph="−" label={t('oneLess')} color={color.accent} onPress={() => pick(minutes - 1)} />
            <AppText variant="bodyStrong" accessibilityLabel={t('minutes', { n: minutes })} style={{ minWidth: 44, textAlign: 'center' }}>
              {minutes}m
            </AppText>
            <IconButton glyph="+" label={t('oneMore')} color={color.accent} onPress={() => pick(minutes + 1)} />
          </View>
        </View>
        <Button label={t('startPractice')} onPress={start} accessibilityLabel={t('startPracticeA11y', { n: minutes })} />
      </View>
    </Screen>
  );
}

function CardBack({ mudra }: { mudra: Mudra }) {
  const { space } = useTheme();
  const { t, mudra: text } = useI18n();
  const m = text(mudra);
  return (
    <ScrollView
      nestedScrollEnabled
      style={styles.fill}
      contentContainerStyle={{ padding: space.xl, gap: space.md }}
      showsVerticalScrollIndicator
    >
      <AppText variant="overline" muted>
        {t('howToForm')}
      </AppText>
      {m.steps.map((step, i) => (
        <AppText key={i}>
          {i + 1}. {step}
        </AppText>
      ))}
      <AppText variant="overline" muted style={{ marginTop: space.sm }}>
        {t('associatedWith')}
      </AppText>
      {m.benefits.map((b) => (
        <AppText key={b}>• {b}</AppText>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center' },
  // Fixed square card; the back face scrolls inside it when the text is long.
  card: { width: '100%', aspectRatio: 1 },
  face: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden', backfaceVisibility: 'hidden' },
  fill: { flex: 1, width: '100%' },
  flipLink: { alignSelf: 'center', minHeight: 48, justifyContent: 'center' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
});
