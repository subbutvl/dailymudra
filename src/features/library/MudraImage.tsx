import { StyleSheet, View, type DimensionValue } from 'react-native';

import type { Mudra } from '@/content/mudras';
import { useTheme } from '@/theme/useTheme';
import { AppText } from '@/ui/AppText';

interface Props {
  mudra: Mudra;
  /** Width; the panel is square unless `height` is given. */
  size: DimensionValue;
  height?: DimensionValue;
  dark?: boolean;
  /** Size of the placeholder initial. */
  glyphSize?: number;
}

/**
 * Placeholder gesture image (docs/SPEC.md §2.0): a surface panel with the
 * mudra's initial and a thin ring. Same size and alt text as the final art,
 * so swapping in real images changes no layout. Replace the inner content
 * with <Image source={...} /> from expo-image when the art lands.
 */
export function MudraImage({ mudra, size, height, dark, glyphSize = 56 }: Props) {
  const { color, radius } = useTheme();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={mudra.imageAlt}
      style={[
        styles.panel,
        {
          width: size,
          height: height ?? size,
          aspectRatio: height ? undefined : 1,
          borderRadius: radius.card,
          backgroundColor: dark ? color.nightSurface : color.surface,
        },
      ]}
    >
      <View style={[styles.ring, { borderColor: dark ? color.nightMuted : color.accentMuted }]}>
        <AppText
          style={{
            fontFamily: 'Outfit_600SemiBold',
            fontSize: glyphSize,
            lineHeight: Math.round(glyphSize * 1.15),
            color: dark ? color.surface : color.accent,
          }}
        >
          {mudra.initial}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ring: {
    width: '62%',
    aspectRatio: 1,
    maxWidth: 260,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
