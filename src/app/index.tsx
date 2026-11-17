import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { MUDRAS, type Mudra } from '@/content/mudras';
import { filterByIntent, groupByPrimaryIntent } from '@/features/library/filterByIntent';
import { IntentChips } from '@/features/library/IntentChips';
import { MudraCard } from '@/features/library/MudraCard';
import { ProgressStrip } from '@/features/progress/ProgressStrip';
import { useI18n } from '@/i18n/useI18n';
import { greetingKey } from '@/lib/time';
import { useSettings } from '@/settings/useSettings';
import { useTheme } from '@/theme/useTheme';
import { AppText } from '@/ui/AppText';
import { IconButton } from '@/ui/IconButton';
import { Screen } from '@/ui/Screen';

export default function Home() {
  const { color, space } = useTheme();
  const { t, intent: intentText } = useI18n();
  const intent = useSettings((s) => s.homeIntent);
  const durations = useSettings((s) => s.durations);
  const welcomeSeen = useSettings((s) => s.welcomeSeen);
  const setSettings = useSettings((s) => s.set);

  if (!welcomeSeen) return <Redirect href="/welcome" />;

  const list = filterByIntent(MUDRAS, intent);
  let index = 0;
  // Cards fade up one after another; re-keyed per filter so a new filter replays it.
  const card = (m: Mudra) => (
    <Animated.View key={`${intent}-${m.id}`} entering={FadeInDown.duration(380).delay(60 * index++)}>
      <MudraCard
        mudra={m}
        minutes={durations[m.id] ?? m.suggestedMinutes}
        onPress={() => router.push({ pathname: '/mudra/[id]', params: { id: m.id } })}
      />
    </Animated.View>
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxxl }}>
        <View style={[styles.header, { paddingHorizontal: space.gutter }]}>
          <AppText variant="h1" accessibilityRole="header">
            DailyMudra
          </AppText>
          <IconButton glyph="⚙" label={t('settings')} color={color.accent} onPress={() => router.push('/settings')} />
        </View>

        <View style={{ paddingHorizontal: space.gutter, gap: space.sm }}>
          <AppText muted>{t(greetingKey())}</AppText>
          <ProgressStrip />
        </View>

        <View style={{ marginVertical: space.xl }}>
          <IntentChips value={intent} onChange={(next) => setSettings({ homeIntent: next })} />
        </View>

        <View style={{ paddingHorizontal: space.gutter, gap: space.md }}>
          {list.length === 0 && <AppText muted>{t('noMudras')}</AppText>}
          {intent === 'all'
            ? groupByPrimaryIntent(list).map((g) => (
                <View key={g.intent} style={{ gap: space.sm, marginBottom: space.sm }}>
                  <AppText variant="overline" muted accessibilityRole="header">
                    {intentText(g.intent).heading}
                  </AppText>
                  {g.mudras.map(card)}
                </View>
              ))
            : list.map(card)}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 8 },
});
