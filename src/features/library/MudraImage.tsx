import { useState } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';

import type { Mudra } from '@/content/mudras';
import { useI18n } from '@/i18n/useI18n';
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
 * mudra's initial inside a thin ring that fills most of the panel. Same size
 * and alt text as the final art, so swapping in real images changes no
 * layout. Replace the inner content with <Image /> from expo-image later.
 */
export function MudraImage({ mudra, size, height, dark, glyphSize = 56 }: Props) {
  const { color, radius } = useTheme();
  const { mudra: text } = useI18n();
  const [ring, setRing] = useState(0);
  return (
    <View
      onLayout={(e) => {
        const { width, height: h } = e.nativeEvent.layout;
        setRing(Math.round(Math.min(width, h) * 0.82));
      }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={text(mudra).imageAlt}
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
      <View style={[styles.ring, { width: ring, height: ring, opacity: ring ? 1 : 0, borderColor: dark ? color.nightMuted : color.accentMuted }]}>
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
  // Ring sized from the panel's shorter side (82%), so it is round in any panel shape.
  ring: {
    borderRadius: 9999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
