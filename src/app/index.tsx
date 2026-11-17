import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MUDRAS, type Mudra } from '@/content/mudras';
import { filterByIntent, groupByPrimaryIntent } from '@/features/library/filterByIntent';
import { IntentChips } from '@/features/library/IntentChips';
import { MudraCard } from '@/features/library/MudraCard';
import { ProgressStrip } from '@/features/progress/ProgressStrip';
import { greeting } from '@/lib/time';
import { useSettings } from '@/settings/useSettings';
import { useTheme } from '@/theme/useTheme';
import { AppText } from '@/ui/AppText';
import { IconButton } from '@/ui/IconButton';

export default function Home() {
  const { color, space } = useTheme();
  const intent = useSettings((s) => s.homeIntent);
  const durations = useSettings((s) => s.durations);
  const welcomeSeen = useSettings((s) => s.welcomeSeen);
  const setSettings = useSettings((s) => s.set);

  if (!welcomeSeen) return <Redirect href="/welcome" />;

  const list = filterByIntent(MUDRAS, intent);
  const card = (m: Mudra) => (
    <MudraCard
      key={m.id}
      mudra={m}
      minutes={durations[m.id] ?? m.suggestedMinutes}
      onPress={() => router.push({ pathname: '/mudra/[id]', params: { id: m.id } })}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxxl }}>
        <View style={[styles.header, { paddingHorizontal: space.gutter }]}>
          <AppText variant="h1" accessibilityRole="header">
            DailyMudra
          </AppText>
          <IconButton glyph="⚙" label="Settings" color={color.accent} onPress={() => router.push('/settings')} />
        </View>

        <View style={{ paddingHorizontal: space.gutter, gap: space.sm }}>
          <AppText muted>{greeting()}</AppText>
          <ProgressStrip />
        </View>

        <View style={{ marginVertical: space.xl }}>
          <IntentChips value={intent} onChange={(next) => setSettings({ homeIntent: next })} />
        </View>

        <View style={{ paddingHorizontal: space.gutter, gap: space.md }}>
          {list.length === 0 && <AppText muted>No mudras for this intent yet</AppText>}
          {intent === 'all'
            ? groupByPrimaryIntent(list).map((g) => (
                <View key={g.intent} style={{ gap: space.sm, marginBottom: space.sm }}>
                  <AppText variant="overline" muted accessibilityRole="header">
                    {g.heading}
                  </AppText>
                  {g.mudras.map(card)}
                </View>
              ))
            : list.map(card)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 8 },
});
