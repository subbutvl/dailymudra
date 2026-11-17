import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DURATION_PRESETS, getMudra, MAX_MINUTES, MIN_MINUTES, type Mudra } from '@/content/mudras';
import { ElementPills } from '@/features/library/ElementTags';
import { MudraImage } from '@/features/library/MudraImage';
import { ensurePermission } from '@/features/session/notifications';
import { useSettings } from '@/settings/useSettings';
import { useTheme } from '@/theme/useTheme';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { IconButton } from '@/ui/IconButton';

/**
 * Mudra Detail as a flip card (picked over the drawer on the wireframes).
 * Front: the gesture image, name and elements. Back: "How to form it" steps
 * and traditional associations. Per C1 the flip is an instant face swap, not
 * a rotation. The duration picker and Start button stay in a sticky footer.
 */
export default function MudraDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mudra = getMudra(id);
  const { color, space } = useTheme();

  if (!mudra) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: color.bg, padding: space.gutter }}>
        <AppText>That mudra could not be found.</AppText>
        <Button label="Back" kind="text" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }
  return <DetailBody mudra={mudra} />;
}

function DetailBody({ mudra }: { mudra: Mudra }) {
  const { color, space, radius } = useTheme();
  const remembered = useSettings((s) => s.durations[mudra.id]);
  const setDuration = useSettings((s) => s.setDuration);
  const minutes = remembered ?? mudra.suggestedMinutes;
  const [showSteps, setShowSteps] = useState(false);

  const pick = (m: number) => setDuration(mudra.id, Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, m)));

  const start = async () => {
    await ensurePermission();
    router.push({ pathname: '/practice/[id]', params: { id: mudra.id, minutes: String(minutes) } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.topBar, { paddingHorizontal: space.sm }]}>
        <IconButton glyph="‹" label="Back" color={color.accent} onPress={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: space.xl, gap: space.lg }}>
        {/* The card: tap anywhere on it (or the link below) to flip. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showSteps ? 'Show gesture image' : 'Show how to form it'}
          accessibilityHint="Flips the card"
          onPress={() => setShowSteps((v) => !v)}
          style={[styles.card, showSteps ? styles.cardBack : styles.cardFront, { backgroundColor: color.surface, borderRadius: radius.card }]}
        >
          {showSteps ? <CardBack mudra={mudra} /> : <MudraImage mudra={mudra} size="100%" glyphSize={88} />}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setShowSteps((v) => !v)}
          style={styles.flipLink}
          hitSlop={8}
        >
          <AppText variant="bodyStrong" style={{ color: color.accent }}>
            {showSteps ? '↺ Show the gesture' : '↻ How to form it'}
          </AppText>
        </Pressable>

        <View style={{ gap: 4 }}>
          <AppText variant="h1" accessibilityRole="header">
            {mudra.name}
          </AppText>
          <AppText muted>
            {mudra.sanskrit} · {mudra.meaning}
          </AppText>
        </View>

        <View style={{ gap: space.sm }}>
          <AppText variant="overline" muted>
            Elements
          </AppText>
          <ElementPills mudra={mudra} />
        </View>

        {mudra.cautions && (
          <AppText variant="caption" muted>
            ⓘ {mudra.cautions}
          </AppText>
        )}
      </ScrollView>

      {/* Sticky footer */}
      <View style={[styles.footer, { backgroundColor: color.bg, borderTopColor: color.accentMuted, padding: space.lg, gap: space.md }]}>
        <View style={styles.durationRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {DURATION_PRESETS.map((p) => (
              <Chip key={p} label={`${p}`} selected={minutes === p} onPress={() => pick(p)} accessibilityLabel={`${p} minutes`} />
            ))}
          </ScrollView>
          <View style={styles.stepper}>
            <IconButton glyph="−" label="One minute less" color={color.accent} onPress={() => pick(minutes - 1)} />
            <AppText variant="bodyStrong" accessibilityLabel={`${minutes} minutes`} style={{ minWidth: 44, textAlign: 'center' }}>
              {minutes}m
            </AppText>
            <IconButton glyph="+" label="One minute more" color={color.accent} onPress={() => pick(minutes + 1)} />
          </View>
        </View>
        <Button label="Start practice" onPress={start} accessibilityLabel={`Start ${minutes} minute practice`} />
      </View>
    </SafeAreaView>
  );
}

function CardBack({ mudra }: { mudra: Mudra }) {
  const { space } = useTheme();
  return (
    <View style={{ padding: space.xl, gap: space.md, width: '100%' }}>
      <AppText variant="overline" muted>
        How to form it
      </AppText>
      {mudra.steps.map((step, i) => (
        <AppText key={i}>
          {i + 1}. {step}
        </AppText>
      ))}
      <AppText variant="overline" muted style={{ marginTop: space.sm }}>
        Traditionally associated with
      </AppText>
      {mudra.benefits.map((b) => (
        <AppText key={b}>• {b}</AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center' },
  card: { width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardFront: { aspectRatio: 1 },
  // The back grows with its text so 200% font size never truncates steps.
  cardBack: { minHeight: 320 },
  flipLink: { alignSelf: 'center', minHeight: 48, justifyContent: 'center' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
});
