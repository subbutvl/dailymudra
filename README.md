# DailyMudra

A calm, distraction-free mudra practice app. Android first, fully offline, no accounts.
Built with React Native + Expo (SDK 58), expo-router, expo-sqlite, Zustand and Reanimated.

The product spec lives in [docs/SPEC.md](docs/SPEC.md).

## Run it

```bash
npm install
npx expo start
```

Then press `a` for an Android emulator, or scan the QR code with **Expo Go** on an Android phone.
Everything in the app works in Expo Go except that a few notification features are limited there;
use a development build (`npx expo run:android` or `eas build --profile development`) for the full behaviour.

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npm test            # jest: session reducer, checkpoint recovery, streaks, filtering
```

## Where things live

```
src/app/                 routes (Home, Detail, Practice, Settings, Welcome)
src/features/library/    mudra cards, intent chips, placeholder image, filtering
src/features/session/    timer reducer + hook, breath cue, checkpoint, end notification
src/features/progress/   SQLite session log, streaks, progress strip
src/content/mudras.ts    the five bundled mudras
src/theme/tokens.ts      colours (calm + vibrant palettes), type scale, spacing
src/db/                  database open + migrations, kv-store helpers
```

## Swapping things in

- **Palette:** Settings → Appearance switches between *Calm* (default) and *Vibrant*. To change the default,
  edit `DEFAULTS.palette` in `src/settings/useSettings.ts`. To retune colours, edit `src/theme/tokens.ts`.
- **Gesture images:** `src/features/library/MudraImage.tsx` draws an initial-letter placeholder.
  Drop WebP art in `assets/mudras/` and render it there with `expo-image`; the layout does not change.
