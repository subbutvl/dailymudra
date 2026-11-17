import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WELLNESS_NOTE } from '@/content/copy';
import { resetProgress } from '@/features/progress/sessionRepo';
import { useProgress } from '@/features/progress/useProgress';
import { useSettings, type Settings } from '@/settings/useSettings';
import { hitTarget, palettes, type PaletteId } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { IconButton } from '@/ui/IconButton';

type BoolKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

export default function SettingsScreen() {
  const { color, space } = useTheme();
  const settings = useSettings();
  const [confirmReset, setConfirmReset] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const toggle = (key: BoolKey, label: string) => (
    <View style={styles.row}>
      <AppText style={{ flex: 1 }}>{label}</AppText>
      <Switch
        accessibilityLabel={label}
        value={settings[key]}
        onValueChange={(v) => settings.set({ [key]: v })}
        trackColor={{ true: color.accent, false: color.accentMuted }}
        thumbColor={color.onAccent}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }}>
      <View style={[styles.header, { paddingHorizontal: space.sm }]}>
        <IconButton glyph="‹" label="Back" color={color.accent} onPress={() => router.back()} />
        <AppText variant="h1" accessibilityRole="header">
          Settings
        </AppText>
      </View>
      <ScrollView contentContainerStyle={{ padding: space.gutter, gap: space.sm }}>
        <AppText variant="overline" muted>
          Appearance
        </AppText>
        <AppText muted variant="caption">
          Palette preview. Calm is the default; Vibrant is the richer emerald and gold option.
        </AppText>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {(Object.keys(palettes) as PaletteId[]).map((p) => (
            <Chip
              key={p}
              label={p === 'calm' ? 'Calm' : 'Vibrant'}
              selected={settings.palette === p}
              onPress={() => settings.set({ palette: p })}
            />
          ))}
        </View>

        <AppText variant="overline" muted style={{ marginTop: space.lg }}>
          Practice
        </AppText>
        {toggle('breathTaps', 'Haptic breath taps')}
        {toggle('hapticsOnComplete', 'Vibrate on completion')}
        {toggle('showImageInPractice', 'Show gesture image in practice')}

        <AppText variant="overline" muted style={{ marginTop: space.lg }}>
          Progress
        </AppText>
        {confirmReset ? (
          <View style={{ gap: space.sm }}>
            <AppText>Delete all practice history? This cannot be undone.</AppText>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button label="Cancel" kind="secondary" onPress={() => setConfirmReset(false)} />
              <Button
                label="Reset"
                onPress={() => {
                  resetProgress();
                  useProgress.getState().refresh();
                  setConfirmReset(false);
                }}
              />
            </View>
          </View>
        ) : (
          <Pressable accessibilityRole="button" style={styles.row} onPress={() => setConfirmReset(true)}>
            <AppText style={{ flex: 1 }}>Reset progress</AppText>
            <AppText style={{ color: color.accent }}>›</AppText>
          </Pressable>
        )}

        <AppText variant="overline" muted style={{ marginTop: space.lg }}>
          About
        </AppText>
        <Pressable accessibilityRole="button" style={styles.row} onPress={() => setShowNote((v) => !v)}>
          <AppText style={{ flex: 1 }}>Wellness note</AppText>
          <AppText style={{ color: color.accent }}>{showNote ? '˅' : '›'}</AppText>
        </Pressable>
        {showNote && <AppText muted>{WELLNESS_NOTE}</AppText>}
        <AppText variant="caption" muted>
          Version 1.0.0
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  row: { minHeight: hitTarget, flexDirection: 'row', alignItems: 'center' },
});
