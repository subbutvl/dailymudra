import { Pressable, StyleSheet } from 'react-native';

import { hitTarget } from '@/theme/tokens';
import { AppText } from './AppText';

interface Props {
  glyph: string;
  label: string;
  onPress: () => void;
  color: string;
}

/** 48dp text-glyph button (no icon font needed for the scaffold). */
export function IconButton({ glyph, label, onPress, color }: Props) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.btn} hitSlop={8}>
      <AppText variant="h2" style={{ color }}>
        {glyph}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: hitTarget, height: hitTarget, alignItems: 'center', justifyContent: 'center' },
});
