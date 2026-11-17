import { Pressable, StyleSheet } from 'react-native';

import { hitTarget } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

/** Single-select chip. Selection is shown by fill AND a check mark (never colour alone). */
export function Chip({ label, selected, onPress, accessibilityLabel }: Props) {
  const { color, radius } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      hitSlop={4}
      style={[
        styles.chip,
        {
          borderRadius: radius.pill,
          borderColor: color.accent,
          backgroundColor: selected ? color.accent : 'transparent',
        },
      ]}
    >
      <AppText variant="bodyStrong" style={{ color: selected ? color.onAccent : color.accent }}>
        {selected ? `✓ ${label}` : label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: hitTarget - 8,
    minWidth: hitTarget,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
