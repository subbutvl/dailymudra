import { useCallback } from 'react';

import { ELEMENT_LABEL, FINGER_LABEL, INTENTS, type ElementId, type Finger, type IntentId, type Mudra } from '@/content/mudras';
import { useSettings } from '@/settings/useSettings';
import { ELEMENT_TA, FINGER_TA, INTENTS_TA, MUDRAS_TA, type MudraText } from './mudras.ta';
import { translate, type Lang, type StringKey } from './strings';

export function mudraText(m: Mudra, lang: Lang): MudraText {
  if (lang === 'ta') return MUDRAS_TA[m.id];
  return { name: m.name, meaning: m.meaning, imageAlt: m.imageAlt, steps: m.steps, benefits: m.benefits, cautions: m.cautions };
}

export function intentText(id: IntentId, lang: Lang): { label: string; heading: string } {
  if (lang === 'ta') return INTENTS_TA[id];
  const i = INTENTS.find((x) => x.id === id)!;
  return { label: i.label, heading: i.heading };
}

export function elementText(id: ElementId, lang: Lang) {
  return lang === 'ta' ? ELEMENT_TA[id] : ELEMENT_LABEL[id];
}

export function fingerText(id: Finger, lang: Lang) {
  return lang === 'ta' ? FINGER_TA[id] : FINGER_LABEL[id];
}

/** Translation hook. Re-renders the caller when the language changes. */
export function useI18n() {
  const lang = useSettings((s) => s.language);
  const t = useCallback((key: StringKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  return {
    lang,
    t,
    mudra: (m: Mudra) => mudraText(m, lang),
    intent: (id: IntentId) => intentText(id, lang),
    element: (id: ElementId) => elementText(id, lang),
    finger: (id: Finger) => fingerText(id, lang),
  };
}
