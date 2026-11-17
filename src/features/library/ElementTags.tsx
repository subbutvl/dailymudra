import { ScrollView, StyleSheet, View } from 'react-native';

import type { Mudra } from '@/content/mudras';
import { elementText, useI18n } from '@/i18n/useI18n';
import type { Lang } from '@/i18n/strings';
import { useTheme } from '@/theme/useTheme';
import { AppText } from '@/ui/AppText';

/**
 * "Index · Air" pills on a warm fill with ink text (warm is never text).
 * Always one line; extra pills scroll horizontally.
 */
export function ElementPills({ mudra }: { mudra: Mudra }) {
  const { color, radius } = useTheme();
  const { finger, element } = useI18n();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {mudra.elements.map((e) => (
        <View key={e.finger} style={[styles.pill, { backgroundColor: color.warm, borderRadius: radius.pill }]}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {finger(e.finger)} · {element(e.element)}
            {e.action === 'fold' ? ' ↓' : ''}
          </AppText>
        </View>
      ))}
    </ScrollView>
  );
}

export function elementSummary(mudra: Mudra, lang: Lang): string {
  return mudra.elements.map((e) => elementText(e.element, lang)).join(' · ');
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 6 },
});
