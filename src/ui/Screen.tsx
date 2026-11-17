import type { ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';
import { MandalaPattern } from './MandalaPattern';

interface Props {
  children: ReactNode;
  /** Dark Practice look. */
  night?: boolean;
  /** Draw the background mandala (default true). */
  pattern?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}

const ALL_EDGES: Edge[] = ['top', 'right', 'bottom', 'left'];

/** Every screen's root: safe-area insets on all sides, theme background, mandala pattern. */
export function Screen({ children, night, pattern = true, edges = ALL_EDGES, style }: Props) {
  const { color } = useTheme();
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: night ? color.night : color.bg }, style]}>
      {pattern && (
        <MandalaPattern
          color={night ? color.nightPattern : color.pattern}
          opacity={night ? color.nightPatternOpacity : color.patternOpacity}
        />
      )}
      {children}
    </SafeAreaView>
  );
}
