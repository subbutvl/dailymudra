import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { hitTarget } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';

interface Props {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'text';
  /** Dark variant for the Practice screen. */
  onNight?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, kind = 'primary', onNight, accessibilityLabel, style }: Props) {
  const { color, radius } = useTheme();
  const bg =
    kind === 'primary' ? (onNight ? color.surface : color.accent) : kind === 'secondary' ? (onNight ? color.nightSurface : 'transparent') : 'transparent';
  const fg =
    kind === 'primary' ? (onNight ? color.night : color.onAccent) : onNight ? color.nightText : color.accent;
  const border = kind === 'secondary' ? (onNight ? color.nightMuted : color.accent) : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor: border, borderRadius: radius.pill, opacity: pressed ? 0.85 : 1 },
        kind === 'primary' && styles.primary,
        style,
      ]}
    >
      <AppText variant="bodyStrong" style={{ color: fg }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: hitTarget,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  primary: { minHeight: 56 },
});
