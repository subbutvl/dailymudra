import { Text, type TextProps } from 'react-native';

import { useSettings } from '@/settings/useSettings';
import { type TypeVariant } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface Props extends TextProps {
  variant?: TypeVariant;
  muted?: boolean;
}

/**
 * Themed text. Outfit/Geist have no Tamil glyphs, so Android falls back to the
 * system Tamil font; Tamil script is taller, so line height gets more room.
 */
export function AppText({ variant = 'body', muted, style, ...rest }: Props) {
  const { type, color } = useTheme();
  const tamil = useSettings((s) => s.language === 'ta');
  const base = type[variant];
  const scripted = tamil ? { lineHeight: Math.round(base.lineHeight * 1.3), letterSpacing: 0 } : null;
  return <Text {...rest} style={[base, scripted, { color: muted ? color.inkMuted : color.ink }, style]} />;
}
