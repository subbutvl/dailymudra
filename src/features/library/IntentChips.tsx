import { ScrollView, StyleSheet } from 'react-native';

import { INTENTS, type IntentFilter } from '@/content/mudras';
import { Chip } from '@/ui/Chip';

interface Props {
  value: IntentFilter;
  onChange: (next: IntentFilter) => void;
}

export function IntentChips({ value, onChange }: Props) {
  const options: { id: IntentFilter; label: string }[] = [{ id: 'all', label: 'All' }, ...INTENTS];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((o) => (
        <Chip
          key={o.id}
          label={o.label}
          selected={value === o.id}
          onPress={() => onChange(o.id)}
          accessibilityLabel={`Filter: ${o.label}`}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 24 },
});
