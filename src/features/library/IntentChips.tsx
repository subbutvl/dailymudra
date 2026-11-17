import { ScrollView, StyleSheet } from 'react-native';

import { INTENTS, type IntentFilter } from '@/content/mudras';
import { useI18n } from '@/i18n/useI18n';
import { Chip } from '@/ui/Chip';

interface Props {
  value: IntentFilter;
  onChange: (next: IntentFilter) => void;
}

export function IntentChips({ value, onChange }: Props) {
  const { t, intent } = useI18n();
  const options: { id: IntentFilter; label: string }[] = [
    { id: 'all', label: t('all') },
    ...INTENTS.map((i) => ({ id: i.id, label: intent(i.id).label })),
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((o) => (
        <Chip
          key={o.id}
          label={o.label}
          selected={value === o.id}
          onPress={() => onChange(o.id)}
          accessibilityLabel={t('filter', { label: o.label })}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 24 },
});
