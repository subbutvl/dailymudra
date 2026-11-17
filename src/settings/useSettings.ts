import { getLocales } from 'expo-localization';
import { create } from 'zustand';

import { kvGet, kvSet } from '@/db/kv';
import type { IntentFilter } from '@/content/mudras';
import type { Lang } from '@/i18n/strings';
import type { PaletteId } from '@/theme/tokens';

export interface Settings {
  palette: PaletteId;
  language: Lang;
  homeIntent: IntentFilter;
  /** Last duration (minutes) chosen per mudra. */
  durations: Record<string, number>;
  hapticsOnComplete: boolean;
  breathTaps: boolean;
  showImageInPractice: boolean;
  welcomeSeen: boolean;
  notificationHintSeen: boolean;
}

const DEFAULTS: Settings = {
  palette: 'calm',
  language: deviceLanguage(),
  homeIntent: 'all',
  durations: {},
  hapticsOnComplete: true,
  breathTaps: false,
  showImageInPractice: true,
  welcomeSeen: false,
  notificationHintSeen: false,
};

const KEY = 'settings.v1';

interface SettingsStore extends Settings {
  hydrated: boolean;
  hydrate: () => void;
  set: (patch: Partial<Settings>) => void;
  setDuration: (mudraId: string, minutes: number) => void;
}

export const useSettings = create<SettingsStore>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,
  hydrate: () => {
    const saved = kvGet<Partial<Settings>>(KEY, {});
    set({ ...DEFAULTS, ...saved, hydrated: true });
  },
  set: (patch) => {
    set(patch);
    persist(get());
  },
  setDuration: (mudraId, minutes) => {
    set({ durations: { ...get().durations, [mudraId]: minutes } });
    persist(get());
  },
}));

function persist(s: SettingsStore) {
  const { hydrated: _h, hydrate: _hy, set: _s, setDuration: _sd, ...data } = s;
  kvSet(KEY, data);
}

function deviceLanguage(): Lang {
  try {
    return getLocales()[0]?.languageCode === 'ta' ? 'ta' : 'en';
  } catch {
    return 'en';
  }
}
