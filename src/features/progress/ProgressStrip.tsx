import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { AppText } from '@/ui/AppText';
import { useProgress } from './useProgress';

export function ProgressStrip() {
  const { color, radius } = useTheme();
  const { todayMin, streak, totalMin, sessionCount } = useProgress();

  if (sessionCount === 0) {
    return (
      <View style={[styles.strip, { backgroundColor: color.surface, borderRadius: radius.card }]} accessible>
        <AppText variant="bodyStrong">Your practice starts today</AppText>
      </View>
    );
  }

  const spoken = `${todayMin} minutes today, ${streak} day streak, ${totalMin} minutes total`;
  return (
    <View
      accessible
      accessibilityLabel={spoken}
      style={[styles.strip, styles.row, { backgroundColor: color.surface, borderRadius: radius.card }]}
    >
      <Stat value={`${todayMin}`} label="min today" />
      <View style={[styles.streak, { backgroundColor: color.warm, borderRadius: radius.pill }]}>
        <Stat value={`${streak}`} label={streak === 1 ? 'day streak' : 'day streak'} />
      </View>
      <Stat value={`${totalMin}`} label="min total" />
    </View>
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
