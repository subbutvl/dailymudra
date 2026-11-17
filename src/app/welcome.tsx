import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WELLNESS_NOTE } from '@/content/copy';
import { useSettings } from '@/settings/useSettings';
import { useTheme } from '@/theme/useTheme';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';

export default function Welcome() {
  const { color, space } = useTheme();
  const set = useSettings((s) => s.set);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }}>
      <View style={[styles.body, { padding: space.gutter, gap: space.lg }]}>
        <AppText variant="h1" accessibilityRole="header">
          Welcome to DailyMudra
        </AppText>
        <AppText>A quiet place to practice five classic hand mudras, a few minutes a day.</AppText>
        <AppText muted>{WELLNESS_NOTE}</AppText>
      </View>
      <View style={{ padding: space.gutter }}>
        <Button
          label="Begin"
          onPress={() => {
            set({ welcomeSeen: true });
            router.replace('/');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center' },
});
