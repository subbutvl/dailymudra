import { StyleSheet, View } from 'react-native';

import { ELEMENT_LABEL, FINGER_LABEL, type Mudra } from '@/content/mudras';
import { useTheme } from '@/theme/useTheme';
import { AppText } from '@/ui/AppText';

/** "Index · Air" pills on a warm fill with ink text (warm is never text). */
export function ElementPills({ mudra }: { mudra: Mudra }) {
  const { color, radius } = useTheme();
  return (
    <View style={styles.row}>
      {mudra.elements.map((e) => (
        <View key={e.finger} style={[styles.pill, { backgroundColor: color.warm, borderRadius: radius.card }]}>
          <AppText variant="caption">{FINGER_LABEL[e.finger]}</AppText>
          <AppText variant="bodyStrong">
            {ELEMENT_LABEL[e.element]}
            {e.action === 'fold' ? ' ↓' : ''}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export function elementSummary(mudra: Mudra): string {
  return mudra.elements.map((e) => ELEMENT_LABEL[e.element]).join(' · ');
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, minWidth: 72 },
});
