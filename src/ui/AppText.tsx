import { Text, type TextProps } from 'react-native';

import { type TypeVariant } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface Props extends TextProps {
  variant?: TypeVariant;
  muted?: boolean;
}

export function AppText({ variant = 'body', muted, style, ...rest }: Props) {
  const { type, color } = useTheme();
  return <Text {...rest} style={[type[variant], { color: muted ? color.inkMuted : color.ink }, style]} />;
}
