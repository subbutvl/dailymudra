import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { LANGUAGES } from '@/i18n/strings';
import { useI18n } from '@/i18n/useI18n';
import { useSettings } from '@/settings/useSettings';
import { useTheme } from '@/theme/useTheme';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Screen } from '@/ui/Screen';

export default function Welcome() {
  const { space } = useTheme();
  const { t, lang } = useI18n();
  const set = useSettings((s) => s.set);
  return (
    <Screen>
      <View style={[styles.body, { padding: space.gutter, gap: space.lg }]}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <AppText variant="h1" accessibilityRole="header">
            {t('welcomeTitle')}
          </AppText>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(500).delay(120)} style={{ gap: space.lg }}>
          <AppText>{t('welcomeTagline')}</AppText>
          <AppText muted>{t('wellnessText')}</AppText>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {LANGUAGES.map((l) => (
              <Chip key={l.id} label={l.label} selected={lang === l.id} onPress={() => set({ language: l.id })} />
            ))}
          </View>
        </Animated.View>
      </View>
      <Animated.View entering={FadeIn.duration(500).delay(300)} style={{ padding: space.gutter }}>
        <Button
          label={t('begin')}
          onPress={() => {
            set({ welcomeSeen: true });
            router.replace('/');
          }}
        />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center' },
});
