import { Pressable, StyleSheet, View } from 'react-native';

import type { Mudra } from '@/content/mudras';
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${mudra.name}, ${mudra.meaning}. ${elementSummary(mudra)}. ${minutes} minutes.`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: color.surface, borderRadius: radius.card, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <MudraImage mudra={mudra} size={80} glyphSize={28} />
      <View style={styles.text}>
        <AppText variant="h2">{mudra.name}</AppText>
        <AppText muted>{mudra.meaning}</AppText>
        <AppText variant="caption" muted>
          {elementSummary(mudra)} · {minutes} min
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
