import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useI18n } from '@/i18n/useI18n';
import { useTheme } from '@/theme/useTheme';
import { AppText } from '@/ui/AppText';
import { useProgress } from './useProgress';

export function ProgressStrip() {
  const { color, radius } = useTheme();
  const { t } = useI18n();
  const { todayMin, streak, totalMin, sessionCount } = useProgress();

  if (sessionCount === 0) {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={[styles.strip, { backgroundColor: color.surface, borderRadius: radius.card }]} accessible>
        <AppText variant="bodyStrong">{t('startsToday')}</AppText>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      accessible
      accessibilityLabel={t('progressSpoken', { today: todayMin, streak, total: totalMin })}
      style={[styles.strip, styles.row, { backgroundColor: color.surface, borderRadius: radius.card }]}
    >
      <Stat value={`${todayMin}`} label={t('minToday')} />
      <View style={[styles.streak, { backgroundColor: color.warm, borderRadius: radius.pill }]}>
        <Stat value={`${streak}`} label={t('dayStreak')} />
      </View>
      <Stat value={`${totalMin}`} label={t('minTotal')} />
    </Animated.View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="h2">{value}</AppText>
      <AppText variant="caption" muted>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stat: { alignItems: 'center', minWidth: 72 },
  streak: { paddingHorizontal: 12, paddingVertical: 4 },
});
