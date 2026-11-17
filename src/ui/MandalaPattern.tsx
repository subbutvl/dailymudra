import { memo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Ellipse, G } from 'react-native-svg';

interface Props {
  color: string;
  opacity: number;
}

/**
 * Static line mandala, drawn twice (top-right and bottom-left, partly off
 * screen) behind screen content. Sits under cards, never on them, and is
 * hidden from accessibility services.
 */
export const MandalaPattern = memo(function MandalaPattern({ color, opacity }: Props) {
  const { width, height } = useWindowDimensions();
  const r = Math.min(width, 480) * 0.62;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height} opacity={opacity}>
        <Mandala cx={width - r * 0.25} cy={r * 0.35} r={r} color={color} />
        <Mandala cx={r * 0.2} cy={height - r * 0.3} r={r * 0.85} color={color} />
      </Svg>
    </View>
  );
});

function Mandala({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  const stroke = { stroke: color, strokeWidth: 1.2, fill: 'none' };
  const petals = (count: number, dist: number, rx: number, ry: number) =>
    Array.from({ length: count }, (_, i) => (
      <Ellipse key={`${count}-${i}`} cx={0} cy={-dist} rx={rx} ry={ry} rotation={(360 / count) * i} origin="0,0" {...stroke} />
    ));
  const dots = (count: number, dist: number, size: number) =>
    Array.from({ length: count }, (_, i) => {
      const a = ((Math.PI * 2) / count) * i;
      return <Circle key={`d${count}-${i}`} cx={Math.cos(a) * dist} cy={Math.sin(a) * dist} r={size} fill={color} />;
    });
  return (
    <G x={cx} y={cy}>
      <Circle r={r * 0.08} {...stroke} />
      <Circle r={r * 0.16} {...stroke} />
      {petals(8, r * 0.27, r * 0.07, r * 0.12)}
      <Circle r={r * 0.4} {...stroke} />
      {petals(16, r * 0.53, r * 0.05, r * 0.13)}
      <Circle r={r * 0.68} {...stroke} />
      {dots(32, r * 0.74, r * 0.012)}
      {petals(24, r * 0.88, r * 0.05, r * 0.11)}
      <Circle r={r} {...stroke} />
    </G>
  );
}
