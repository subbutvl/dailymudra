import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { resetProgress } from '@/features/progress/sessionRepo';
import { useProgress } from '@/features/progress/useProgress';
import { LANGUAGES } from '@/i18n/strings';
import { useI18n } from '@/i18n/useI18n';
import { useSettings, type Settings } from '@/settings/useSettings';
import { hitTarget, palettes, type PaletteId } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { IconButton } from '@/ui/IconButton';
import { Screen } from '@/ui/Screen';

type BoolKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

export default function SettingsScreen() {
  const { color, space } = useTheme();
  const { t } = useI18n();
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

  const section = (label: string) => (
    <AppText variant="overline" muted style={{ marginTop: space.lg }} accessibilityRole="header">
      {label}
    </AppText>
  );

  return (
    <Screen>
      <View style={[styles.header, { paddingHorizontal: space.sm }]}>
        <IconButton glyph="‹" label={t('back')} color={color.accent} onPress={() => router.back()} />
        <AppText variant="h1" accessibilityRole="header">
          {t('settings')}
        </AppText>
      </View>
      <ScrollView contentContainerStyle={{ padding: space.gutter, paddingTop: 0, gap: space.sm }}>
        {section(t('language'))}
        <View style={styles.chips}>
          {LANGUAGES.map((l) => (
            <Chip key={l.id} label={l.label} selected={settings.language === l.id} onPress={() => settings.set({ language: l.id })} />
          ))}
        </View>

        {section(t('appearance'))}
        <AppText muted variant="caption">
          {t('paletteHint')}
        </AppText>
        <View style={styles.chips}>
          {(Object.keys(palettes) as PaletteId[]).map((p) => (
            <Chip key={p} label={t(p)} selected={settings.palette === p} onPress={() => settings.set({ palette: p })} />
          ))}
        </View>

        {section(t('practice'))}
        {toggle('breathTaps', t('breathTaps'))}
        {toggle('hapticsOnComplete', t('vibrateOnComplete'))}
        {toggle('showImageInPractice', t('showImageInPractice'))}

        {section(t('progress'))}
        {confirmReset ? (
          <Animated.View entering={FadeIn.duration(250)} style={{ gap: space.sm }}>
            <AppText>{t('resetConfirm')}</AppText>
            <View style={styles.chips}>
              <Button label={t('cancel')} kind="secondary" onPress={() => setConfirmReset(false)} />
              <Button
                label={t('reset')}
                onPress={() => {
                  resetProgress();
                  useProgress.getState().refresh();
                  setConfirmReset(false);
                }}
              />
            </View>
          </Animated.View>
        ) : (
          <Pressable accessibilityRole="button" style={styles.row} onPress={() => setConfirmReset(true)}>
            <AppText style={{ flex: 1 }}>{t('resetProgress')}</AppText>
            <AppText style={{ color: color.accent }}>›</AppText>
          </Pressable>
        )}

        {section(t('about'))}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showNote }}
          style={styles.row}
          onPress={() => setShowNote((v) => !v)}
        >
          <AppText style={{ flex: 1 }}>{t('wellnessNote')}</AppText>
          <AppText style={{ color: color.accent }}>{showNote ? '˅' : '›'}</AppText>
        </Pressable>
        {showNote && (
          <Animated.View entering={FadeIn.duration(250)}>
            <AppText muted>{t('wellnessText')}</AppText>
          </Animated.View>
        )}
        <AppText variant="caption" muted>
          {t('version', { v: '1.0.0' })}
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  row: { minHeight: hitTarget, flexDirection: 'row', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
