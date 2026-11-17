import Storage from 'expo-sqlite/kv-store';

/** Tiny typed JSON helpers over expo-sqlite/kv-store (settings, checkpoints). */
export function kvGet<T>(key: string, fallback: T): T {
  try {
    const raw = Storage.getItemSync(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function kvSet(key: string, value: unknown): void {
  Storage.setItemSync(key, JSON.stringify(value));
}

export function kvRemove(key: string): void {
  Storage.removeItemSync(key);
}
