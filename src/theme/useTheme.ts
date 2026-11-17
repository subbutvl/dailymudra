import { palettes, radius, space, type } from './tokens';
import { useSettings } from '@/settings/useSettings';

export function useTheme() {
  const paletteId = useSettings((s) => s.palette);
  return { color: palettes[paletteId], type, space, radius, paletteId };
}
