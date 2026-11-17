import { create } from 'zustand';

import { getStats, type Stats } from './sessionRepo';

interface ProgressStore extends Stats {
  loaded: boolean;
  refresh: () => void;
}

export const useProgress = create<ProgressStore>((set) => ({
  todayMin: 0,
  totalMin: 0,
  streak: 0,
  longestStreak: 0,
  sessionCount: 0,
  loaded: false,
  refresh: () => set({ ...getStats(), loaded: true }),
}));
