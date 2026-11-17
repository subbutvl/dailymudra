import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { HOW_TO, WHEN_TO, WIKI, type HelpSection } from '@/content/help';
import { MUDRAS, type Mudra } from '@/content/mudras';
import { MudraImage } from '@/features/library/MudraImage';
import { useI18n } from '@/i18n/useI18n';
import { useTheme } from '@/theme/useTheme';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { IconButton } from '@/ui/IconButton';
import { Screen } from '@/ui/Screen';

type Tab = 'how' | 'when' | 'wiki';

/** Help: how to practice, when to practice, and a short wiki for each mudra. */
export default function Help() {
  const { color, space } = useTheme();
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<Tab>('how');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'how', label: t('tabHow') },
    { id: 'when', label: t('tabWhen') },
    { id: 'wiki', label: t('tabWiki') },
  ];

  return (
    <Screen>
      {/* Sticky header + tabs */}
      <View style={[styles.header, { paddingHorizontal: space.sm }]}>
        <IconButton glyph="‹" label={t('back')} color={color.accent} onPress={() => router.back()} />
        <AppText variant="h1" accessibilityRole="header">
          {t('helpTitle')}
        </AppText>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={{ gap: 8, paddingHorizontal: space.gutter, paddingBottom: space.md }}
        accessibilityRole="tablist"
      >
        {tabs.map((x) => (
          <Chip key={x.id} label={x.label} selected={tab === x.id} onPress={() => setTab(x.id)} />
        ))}
      </ScrollView>

      <ScrollView key={tab} contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: space.sm, paddingBottom: space.xxxl, gap: space.lg }}>
        {tab === 'how' && HOW_TO[lang].map((sec, i) => <Section key={sec.title} section={sec} index={i} />)}
        {tab === 'when' && WHEN_TO[lang].map((sec, i) => <Section key={sec.title} section={sec} index={i} />)}
        {tab === 'wiki' && MUDRAS.map((m, i) => <WikiCard key={m.id} mudra={m} index={i} />)}
      </ScrollView>
    </Screen>
  );
}

function Section({ section, index }: { section: HelpSection; index: number }) {
  const { color, space, radius } = useTheme();
  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(80 * index)}
      style={{ backgroundColor: color.surface, borderRadius: radius.card, padding: space.xl, gap: space.md }}
    >
      <AppText variant="h2" accessibilityRole="header">
        {section.title}
      </AppText>
      {section.items.map((item, i) => (
        <View key={i} style={styles.item}>
          <AppText variant="bodyStrong" style={{ color: color.accent, minWidth: 22 }}>
            {section.numbered ? `${i + 1}.` : '•'}
          </AppText>
          <AppText style={{ flex: 1 }}>{item}</AppText>
        </View>
      ))}
    </Animated.View>
  );
}

function WikiCard({ mudra, index }: { mudra: Mudra; index: number }) {
  const { color, space, radius } = useTheme();
  const { t, lang, mudra: text } = useI18n();
  const [open, setOpen] = useState(false);
  const m = text(mudra);
  const w = WIKI[lang][mudra.id];
  const rows: [string, string][] = [
    [t('wikiOverview'), w.overview],
    [t('wikiElements'), w.elements],
    [t('wikiBestTime'), w.bestTime],
    [t('wikiDuration'), w.duration],
    [t('wikiTips'), w.tips],
  ];
  if (m.cautions) rows.push([t('wikiCaution'), m.cautions]);

  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(60 * index)}
      layout={LinearTransition.duration(250)}
      style={{ backgroundColor: color.surface, borderRadius: radius.card, overflow: 'hidden' }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${m.name}, ${m.meaning}`}
        onPress={() => setOpen((v) => !v)}
        style={[styles.wikiHead, { padding: space.md, gap: space.lg }]}
      >
        <MudraImage mudra={mudra} size={56} glyphSize={22} />
        <View style={{ flex: 1 }}>
          <AppText variant="h2">{m.name}</AppText>
          <AppText muted variant="caption">
            {mudra.sanskrit} · {m.meaning}
          </AppText>
        </View>
        <AppText variant="h2" style={{ color: color.accent }} importantForAccessibility="no">
          {open ? '˄' : '˅'}
        </AppText>
      </Pressable>
      {open && (
        <Animated.View entering={FadeIn.duration(250)} style={{ paddingHorizontal: space.xl, paddingBottom: space.xl, gap: space.md }}>
          {rows.map(([label, body]) => (
            <View key={label} style={{ gap: 2 }}>
              <AppText variant="overline" muted>
                {label}
              </AppText>
              <AppText>{body}</AppText>
            </View>
          ))}
          <Button
            label={t('practiceThis', { name: m.name })}
            kind="secondary"
            onPress={() => router.push({ pathname: '/mudra/[id]', params: { id: mudra.id } })}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabsScroll: { flexGrow: 0 },
  item: { flexDirection: 'row', gap: 8 },
  wikiHead: { flexDirection: 'row', alignItems: 'center' },
});
