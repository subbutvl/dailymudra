import { Pressable, StyleSheet, View } from 'react-native';

import type { Mudra } from '@/content/mudras';
import { useI18n } from '@/i18n/useI18n';
import { useTheme } from '@/theme/useTheme';
import { AppText } from '@/ui/AppText';
import { elementSummary } from './ElementTags';
import { MudraImage } from './MudraImage';

interface Props {
  mudra: Mudra;
  minutes: number;
  onPress: () => void;
}

export function MudraCard({ mudra, minutes, onPress }: Props) {
  const { color, radius } = useTheme();
  const { t, lang, mudra: text } = useI18n();
  const m = text(mudra);
  const elements = elementSummary(mudra, lang);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${m.name}, ${m.meaning}. ${elements}. ${t('minutes', { n: minutes })}.`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: color.surface, borderRadius: radius.card, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <MudraImage mudra={mudra} size={80} glyphSize={30} />
      <View style={styles.text}>
        <AppText variant="h2">{m.name}</AppText>
        <AppText muted>{m.meaning}</AppText>
        <AppText variant="caption" muted>
          {elements} · {t('minShort', { n: minutes })}
        </AppText>
      </View>
      <AppText variant="h2" style={{ color: color.accent }} importantForAccessibility="no">
        ›
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 16 },
  text: { flex: 1, gap: 2 },
});
