# DailyMudra: Product Specification & UX Architecture

**Status:** Draft v0.1 for review · **Platform:** Android first (React Native + Expo) · **Backend:** none, fully offline

DailyMudra is a calm, distraction-free companion for practicing hand mudras. A person picks a mudra, reads how to form it, and practices for a set time with a quiet breath-pacing cue. The app remembers how many minutes they have practiced and how many days in a row.

## 0. Constraints this spec is built on

| # | Constraint | How the spec honors it |
|---|---|---|
| C1 | No animation. Gestures are static images. | All gesture visuals are static WebP images. Screen transitions are off (`animation: 'none'`). The countdown dial steps once per second rather than sweeping. |
| C1a | One exception: a soft looping breath-pacing cue on the Practice screen. | The breath cue is the **only** animated element in the app. It runs on the UI thread and falls back to a non-moving text cue when the system "Remove animations" setting is on. |
| C2 | Exactly 5 bundled mudras: Gyan, Prana, Apana, Vayu, Shunya. | Mudra content is a typed, read-only module compiled into the app. No downloads, no CMS. |
| C3 | High performance, accessible, clean, distraction-free. | No network, no analytics, no ads, no sign-in. TalkBack and font scaling are first-class requirements (see §1.4). |
| C4 | Self-contained, no external backend. | All state lives on device in SQLite (§3.3). |

**Out of scope for v1:** accounts, cloud sync, reminders/notifications (open question Q3), audio guidance, custom mudras, iOS polish, tablets.

---

## Phase 1: Feature & Functional Specification

### 1.1 Mudra Library

#### Data model

```ts
type ElementId = 'fire' | 'air' | 'space' | 'earth' | 'water';
type IntentId  = 'calm-focus' | 'energy' | 'digestion' | 'balance' | 'ear-head';

interface Mudra {
  id: 'gyan' | 'prana' | 'apana' | 'vayu' | 'shunya';
  name: string;              // "Gyan Mudra"
  sanskrit: string;          // "ज्ञान मुद्रा"
  meaning: string;           // "Gesture of knowledge"
  intents: IntentId[];       // first entry = primary intent (used for grouping on Home)
  elements: { finger: Finger; element: ElementId; action: 'touch' | 'fold' }[];
  image: ImageSourcePropType; // require('…/gyan.webp'), static
  imageAlt: string;          // full TalkBack description of the hand position
  steps: string[];           // 3–5 short "how to form it" steps
  benefits: string[];        // 3–4 bullets, phrased as traditional associations
  cautions?: string;         // e.g. "Practice Vayu only until symptoms ease"
  suggestedMinutes: number;  // default duration preset on the Detail screen
}
```

Finger to element mapping used across the app (traditional Ayurvedic mapping): thumb = fire, index = air, middle = space, ring = earth, little = water.

#### Launch content

| Mudra | Formation | Element action | Primary intent | Also tagged | Suggested time |
|---|---|---|---|---|---|
| **Gyan** | Index tip touches thumb tip | Air + fire joined | Calm & Focus | — | 10 min |
| **Prana** | Ring + little tips touch thumb tip | Earth + water + fire joined | Energy & Vitality | Calm & Focus | 10 min |
| **Apana** | Middle + ring tips touch thumb tip | Space + earth + fire joined | Digestion & Detox | — | 10 min |
| **Vayu** | Index folded to thumb base, thumb presses over it | Air reduced | Balance & Relief | — | 5 min |
| **Shunya** | Middle folded to thumb base, thumb presses over it | Space reduced | Ear & Head | Balance & Relief | 5 min |

> Copy rule: benefits are phrased as "traditionally associated with…", never as medical claims. A one-time wellness disclaimer is shown on first launch and kept under Settings → About. This also keeps the Play Store listing out of health-claim review trouble.

#### Filtering by intent

- Five intent filters, shown as a single horizontally scrollable row of chips on Home: **All · Calm & Focus · Energy · Digestion · Balance · Ear & Head**.
- Single-select. "All" is the default and shows mudras grouped under their **primary** intent heading. Selecting an intent shows every mudra tagged with it (primary or secondary), as a flat list.
- Filtering is a pure in-memory function over a 5-item constant array: `filterByIntent(mudras, intent)`. No search box in v1 (5 items do not need one).
- The selected chip is remembered across launches (settings key `home.intent`).
- Empty state is impossible with launch data, but the list component still renders "No mudras for this intent yet" so the code is safe when content grows.

### 1.2 Session Timer Engine

#### Principles

1. **Wall-clock based, not tick based.** The engine stores timestamps, never "seconds remaining decremented by an interval". A JS interval drifts and stops when the app is backgrounded; timestamps do not. Remaining time is always *derived*: `remaining = endsAt - now`.
2. **One pure reducer, one thin hook.** All transitions live in a pure `sessionReducer(state, event)` that is unit tested without React Native. A `useSessionTimer` hook wires it to the clock, `AppState`, keep-awake and persistence.
3. **The screen re-renders at most once per second**, and only the dial and time label subscribe to the tick.

#### State machine

```
            START(durationSec)
   ┌──────┐ ───────────────▶ ┌─────────┐   PAUSE / app→background   ┌────────┐
   │ idle │                  │ running │ ─────────────────────────▶ │ paused │
   └──────┘                  └─────────┘ ◀───────────────────────── └────────┘
                               │     │            RESUME                 │
                  TICK where   │     │ END_EARLY                END_EARLY│
                  now ≥ endsAt │     └───────────────┐   ┌───────────────┘
                               ▼                     ▼   ▼
                         ┌───────────┐          ┌──────────┐
                         │ completed │          │  ended   │  (partial)
                         └───────────┘          └──────────┘
                               │ both: write session row, then show Completion
```

```ts
type SessionState =
  | { status: 'idle' }
  | { status: 'running';   mudraId; plannedSec; startedAt; endsAt; pausedTotalMs }
  | { status: 'paused';    mudraId; plannedSec; startedAt; remainingMs; pausedAt; pausedTotalMs; pauseReason: 'user' | 'interruption' }
  | { status: 'completed'; mudraId; plannedSec; practicedSec; startedAt; endedAt }
  | { status: 'ended';     mudraId; plannedSec; practicedSec; startedAt; endedAt };

type SessionEvent =
  | { type: 'START'; mudraId; plannedSec; now }
  | { type: 'PAUSE'; now; reason: 'user' | 'interruption' }
  | { type: 'RESUME'; now }          // endsAt = now + remainingMs
  | { type: 'TICK'; now }            // only transitions when now ≥ endsAt
  | { type: 'END_EARLY'; now }
  | { type: 'RESET' };
```

#### Durations

- Presets on the Detail screen: **3, 5, 10, 15, 20 min**, defaulting to the mudra's `suggestedMinutes` (or the last value the person used for that mudra).
- A small "−/+" stepper allows 1 to 60 min in 1 min steps for anyone who wants a custom length. No free-text input.

#### Interruptions and pauses

| Situation | Behavior |
|---|---|
| Person taps Pause | `PAUSE(reason:'user')`. Dial freezes, breath cue stops and shows "Paused". |
| Incoming call, app switch, or notification shade opened (`AppState` → `background`) | `PAUSE(reason:'interruption')`. On return, the screen shows "Paused while you were away" with **Resume** and **End**. We auto-pause rather than keep counting, because a practice that was interrupted was not practice. (Default; see Q3.) |
| `AppState` → `inactive` only (brief system overlay) | Ignored. Only `background` pauses, to avoid false pauses. |
| Screen would time out | Prevented with `expo-keep-awake` while `running`. Released on pause, end and unmount. Brightness is not changed. |
| Back gesture / hardware back during `running` or `paused` | Opens a small confirm sheet: "End session? You've practiced 4 min." **Keep going** (default, focused) / **End session**. |
| App killed or crashed mid-session | The in-flight session is check-pointed to the KV store on every state change (`startedAt`, `plannedSec`, `pausedTotalMs`, status). On next launch, if a checkpoint exists, it is closed as `ended` with practiced time calculated up to the last checkpoint, and credited. No resume prompt (keeps launch calm). |
| Device clock changed during a session | `practicedSec` is clamped to `[0, plannedSec]`. Uses `Date.now()`; accuracy within ±1 s is acceptable. |

#### Completion state

- When `now ≥ endsAt`, the engine fires `completed`, writes the session row, releases keep-awake, and triggers a single gentle haptic (`Haptics.notificationAsync(Success)`) if haptics are enabled. No sound in v1.
- The Practice screen swaps in place to the **Completion** layout (§2.4). No navigation transition.
- **Crediting rule:** a session is saved if `practicedSec ≥ 60`. Completed and ended-early sessions both count toward total minutes. Shorter sessions are discarded silently.

### 1.3 Local persistence: minutes and streaks

#### What is stored

```sql
CREATE TABLE sessions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  mudra_id      TEXT    NOT NULL,
  started_at    INTEGER NOT NULL,   -- epoch ms
  ended_at      INTEGER NOT NULL,
  planned_sec   INTEGER NOT NULL,
  practiced_sec INTEGER NOT NULL,
  completed     INTEGER NOT NULL,   -- 1 = ran to the end, 0 = ended early
  local_day     TEXT    NOT NULL    -- 'YYYY-MM-DD' in device time zone at start
);
CREATE INDEX idx_sessions_day ON sessions(local_day);
```

Settings and small UI state (intent filter, durations per mudra, haptics on/off, breath pattern, disclaimer seen, in-flight checkpoint) live in `expo-sqlite/kv-store`.

The session log is the **single source of truth**. Totals and streaks are derived, never stored as counters that could drift.

#### Derived stats

- **Total minutes** = `SUM(practiced_sec) / 60`, floored.
- **Today's minutes** = sum where `local_day = today`.
- **Practice day** = any `local_day` with ≥ 1 credited session.
- **Current streak**: walk backwards over distinct `local_day`s from today. If today has practice, start at today. If not, start at yesterday (the streak is still alive until the day ends). Count consecutive days.
- **Longest streak**: one pass over distinct days, kept for the Progress strip.
- `local_day` is captured at session start, so a session that crosses midnight counts for the day it began. Time zone travel uses whatever the device zone was at start; that is acceptable for v1.

Queries run once at app start and after each saved session, then cached in a small Zustand store (`useProgressStore`) that Home reads. At realistic volume (a few sessions a day for years) these queries are sub-millisecond.

#### Data safety

- Schema version tracked with `PRAGMA user_version`, migrations run at boot.
- Android Auto Backup is left on (default), so data survives reinstall on the same Google account with no backend.
- Settings → **Reset progress** clears `sessions` after a confirm dialog.

### 1.4 Cross-cutting: accessibility & performance requirements

**Accessibility (target: WCAG 2.2 AA equivalent on Android)**
- Every interactive element ≥ 48×48 dp, with `accessibilityRole` and a clear `accessibilityLabel`.
- Each mudra image has a full `imageAlt` that describes the hand position, so the app is usable without seeing the image.
- Text uses `sp` scaling and layouts are tested at 200% system font size. No truncated essential text.
- Contrast: body text ≥ 4.5:1, large text and UI glyphs ≥ 3:1, in both light screens and the dark Practice screen.
- Countdown announcements: the time label is **not** a live region every second (that would be noisy). TalkBack hears remaining time when focused, plus a polite announcement at each whole minute and at completion.
- Breath cue honors **Remove animations** (`useReducedMotion`): it becomes a still circle with the words "Inhale" / "Exhale" changing on the same rhythm, plus optional haptic taps.
- Colour is never the only signal (the selected chip also gets a check mark and `accessibilityState.selected`).

**Performance budgets**
- Cold start to interactive Home: < 1.5 s on a mid-range Android device (e.g. Pixel 6a class).
- Practice screen: 60 fps breath cue with the JS thread idle between 1 s ticks.
- APK/AAB download size: < 25 MB. Each gesture image ≤ 150 KB WebP.
- Zero network requests. The app requests no runtime permissions in v1.

---

## Phase 2: Screen Architecture & UX Flow

### 2.1 Navigation map

```
 First launch only
 ┌───────────────────┐
 │ Welcome +         │──"Begin"──┐
 │ wellness note     │           │
 └───────────────────┘           ▼
                       ┌──────────────────┐   tap card    ┌──────────────────┐  Start   ┌──────────────────┐
                       │      HOME        │──────────────▶│   MUDRA DETAIL   │─────────▶│ PRACTICE (dark)  │
                       │ progress strip   │◀──── back ────│ image, elements, │          │ running ↔ paused │
                       │ intent chips     │               │ benefits, time   │          │        │         │
                       │ mudra list       │               └──────────────────┘          │        ▼         │
                       └──────────────────┘                                             │   COMPLETION     │
                         │ gear icon    ▲                                               └──────────────────┘
                         ▼              │                             "Done" ─────────────▶ HOME (stack reset)
                       ┌──────────────────┐                           "Practice again" ───▶ PRACTICE (same mudra)
                       │    SETTINGS      │
                       └──────────────────┘
```

Routes (expo-router): `/` Home, `/mudra/[id]` Detail, `/practice/[id]` Practice (full-screen, gestures to dismiss disabled), `/settings`, `/welcome`. Three taps from launch to practicing: card → Start → (session begins immediately, no countdown-to-start).

### 2.2 Home / Dashboard

```
┌────────────────────────────────────┐
│ DailyMudra                     ⚙   │  app title (left), Settings (right, 48dp)
│                                    │
│ Good morning                       │  time-of-day greeting, muted
│ ┌────────────────────────────────┐ │
│ │  12 min      🔥 4 days    186  │ │  Progress strip: Today · Streak · Total min
│ │  today       streak      total │ │  one tap target → no navigation in v1
│ └────────────────────────────────┘ │
│                                    │
│ [All✓] [Calm & Focus] [Energy] [Di→│  intent chips, horizontal scroll, single-select
│                                    │
│ CALM & FOCUS                       │  section header (only in "All")
│ ┌────────────────────────────────┐ │
│ │ ┌──────┐ Gyan Mudra            │ │  Mudra card:
│ │ │ img  │ Gesture of knowledge  │ │   80dp static thumbnail, name, meaning,
│ │ │      │ Air · Fire   · 10 min │ │   element tags + suggested time.
│ │ └──────┘                     › │ │   Whole card is one button.
│ └────────────────────────────────┘ │
│ ENERGY & VITALITY                  │
│ ┌────────────────────────────────┐ │
│ │ [img] Prana Mudra …          › │ │
│ └────────────────────────────────┘ │
│ DIGESTION & DETOX                  │
│ │ [img] Apana Mudra …          › │ │
│ BALANCE & RELIEF                   │
│ │ [img] Vayu Mudra …           › │ │
│ EAR & HEAD                         │
│ │ [img] Shunya Mudra …         › │ │
└────────────────────────────────────┘
```

- Light theme. One column, generous 24 dp gutters, no bottom tab bar (only one primary destination).
- First-ever launch: the progress strip reads "Your practice starts today" instead of zeros.
- TalkBack order: title → settings → progress strip (read as one sentence, "12 minutes today, 4 day streak, 186 minutes total") → chips → sections.
- Implementation: a plain `ScrollView` with sections. Virtualised lists are unnecessary for five rows and cost startup time.

### 2.3 Mudra Detail

```
┌────────────────────────────────────┐
│ ‹ Back                             │
│                                    │
│        ┌──────────────────┐        │
│        │                  │        │  Static gesture image, square,
│        │   gesture image  │        │  max 280dp, centered, soft
│        │                  │        │  neutral background panel
│        └──────────────────┘        │
│                                    │
│ Gyan Mudra                         │  H1
│ ज्ञान मुद्रा · Gesture of knowledge  │  subtitle, muted
│                                    │
│ ELEMENTS                           │
│ ┌──────┐ ┌──────┐                  │  element pills: finger → element
│ │Index │ │Thumb │   joined         │  e.g. "Index · Air" + "Thumb · Fire"
│ │ Air  │ │ Fire │                  │
│ └──────┘ └──────┘                  │
│                                    │
│ HOW TO FORM IT                     │
│ 1. Sit comfortably, palms up.      │
│ 2. Touch index tip to thumb tip.   │
│ 3. Keep other fingers relaxed.     │
│                                    │
│ TRADITIONALLY ASSOCIATED WITH      │
│ • Calmer, steadier attention       │
│ • Support for memory and study     │
│ • Easing restlessness              │
│                                    │
│ ⓘ Practice gently. Not medical     │  caution line (only if mudra has one)
│   advice.                          │
│                                    │
├────────────────────────────────────┤  ← sticky footer (always visible)
│ Duration  (3)(5)[10](15)(20)  −  + │  preset chips, current = filled
│ ┌────────────────────────────────┐ │
│ │        Start practice          │ │  Primary CTA, full width, 56dp tall
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

- Content scrolls under a **sticky footer** so the CTA is always one tap away, even at 200% font size.
- Duration choice is remembered per mudra.

### 2.4 Active Practice (dark, immersive)

**Running**
```
┌────────────────────────────────────┐  background: deep night (e.g. #0F1416),
│ ✕                        Gyan      │  status bar hidden, nav bar dimmed.
│                                    │  ✕ = End (opens confirm sheet)
│        ┌──────────────────┐        │
│        │  gesture image   │        │  Static image, 160dp, desaturated/
│        │   (reference)    │        │  low-contrast so it guides but
│        └──────────────────┘        │  does not dominate
│                                    │
│          ╭────────────────╮        │
│        ╭─┤   ◯ breath    ├─╮      │  Countdown DIAL (SVG ring, 260dp).
│        │ │    cue        │ │      │  Ring empties in 1 s steps (no sweep).
│        │ │    08:42      │ │      │  Time label: large tabular numerals.
│        │ │   Inhale      │ │      │  Breath cue: soft circle INSIDE the dial,
│        ╰─┤               ├─╯      │  slowly grows (inhale) / shrinks (exhale),
│          ╰────────────────╯        │  label fades between "Inhale"/"Exhale".
│                                    │
│                                    │
│            ┌──────────┐            │
│            │  ❚❚ Pause │           │  Single secondary control, 56dp
│            └──────────┘            │
└────────────────────────────────────┘
```

- **Breath cue spec:** default rhythm *inhale 4 s → exhale 6 s* (a calming, longer exhale), looping. The circle scales between 0.6 and 1.0 with an ease-in-out curve. Opacity range 0.35 to 0.6, so it is soft in a dark room. Rhythm is selectable in Settings (see Q4).
- The breath cue lives inside the dial so the eye has **one** focal point. The gesture image sits above as a reference and can be hidden with a tap ("Hide image" in Settings for those who know the pose).
- Nothing else moves. No progress percentages, no quotes, no streak reminders during practice.

**Paused**
```
│          ╭────────────────╮        │
│          │     08:42      │        │  dial frozen, breath cue removed
│          │    Paused      │        │
│          ╰────────────────╯        │
│   ┌──────────┐   ┌──────────────┐  │
│   │   End    │   │  ▶ Resume    │  │  Resume = primary, End = secondary
│   └──────────┘   └──────────────┘  │
```
If paused by interruption, the label reads "Paused while you were away".

**Completion (same screen, swapped in place)**
```
┌────────────────────────────────────┐
│                                    │
│              ✓                     │
│      10 minutes of Gyan            │  H1
│                                    │
│   🔥 5-day streak · 196 min total   │  updated stats; streak +1 only if
│                                    │  this was the first session today
│   Take a moment before you move.   │  one quiet line, no confetti
│                                    │
│ ┌────────────────────────────────┐ │
│ │             Done               │ │  → Home
│ └────────────────────────────────┘ │
│          Practice again            │  text button → restart same mudra
└────────────────────────────────────┘
```
Ended-early sessions show "4 minutes of Gyan" with the same layout (no guilt copy). Sessions under 1 minute go straight back to Detail with no Completion screen.

### 2.5 Settings (minimal)

```
┌────────────────────────────────────┐
│ ‹ Settings                         │
│ PRACTICE                           │
│ Breath rhythm         4 · 6     ›  │  options: 4·4, 4·6, 4·7·8, Off
│ Haptic breath taps         [ ○ ]   │
│ Haptic on completion       [ ● ]   │
│ Show gesture image in practice[●]  │
│ PROGRESS                           │
│ Reset progress                  ›  │  confirm dialog
│ ABOUT                              │
│ Wellness note                   ›  │
│ Version 1.0.0                      │
└────────────────────────────────────┘
```

### 2.6 Primary UX flow (happy path)

1. Open app → Home shows today's minutes and streak.
2. (Optional) tap an intent chip, e.g. *Calm & Focus*.
3. Tap **Gyan** card → Detail.
4. Read steps, keep the remembered 10 min, tap **Start practice**.
5. Practice screen opens dark; timer starts immediately; screen stays awake.
6. Follow the breath cue; a call comes in → session auto-pauses; return → **Resume**.
7. Timer reaches 0 → gentle haptic → Completion shows updated streak.
8. **Done** → Home, strip shows new totals.

---

## Phase 3: Technical Stack & Implementation Plan

### 3.1 Stack decision: React Native + Expo (confirmed)

The stack is already chosen. A brief check against Flutter for this specific app:

| Factor | React Native + Expo | Flutter | Verdict for DailyMudra |
|---|---|---|---|
| Android-first build & release | EAS Build / Submit, `expo prebuild` | Gradle + manual Play setup | Expo is less friction |
| Offline data | `expo-sqlite` in the SDK | `sqflite` / `drift` | Even |
| One looping 60 fps animation | Reanimated (UI thread) | Built in | Even |
| Accessibility (TalkBack) | Native Android views, so TalkBack behaves natively | Own rendering + semantics tree | Slight edge to RN |
| Startup / size | Hermes + new architecture, fine for 5 screens | Slightly smaller cold start | Not a deciding factor at this scale |
| Iteration speed | Expo Go / dev client, OTA updates possible | Hot reload | Even |
| Path to iOS later | Same code | Same code | Even |

Conclusion: nothing about this app favors switching. Expo stays.

### 3.2 Libraries (all in the Expo SDK unless marked)

| Concern | Choice | Why |
|---|---|---|
| Framework | Expo SDK (latest stable), New Architecture, Hermes, TypeScript strict | Defaults, fastest path |
| Navigation | `expo-router` (stack only) | File-based routes, deep-linkable `/mudra/gyan`, transitions set to `none` |
| Images | `expo-image` | Fast decode, memory-cached static WebPs |
| Timer dial | `react-native-svg` | One `Circle` with `strokeDashoffset` |
| Breath cue | `react-native-reanimated` (`withRepeat`, `useReducedMotion`) | Runs on the UI thread, so the JS 1 s tick cannot stutter it |
| Keep screen on | `expo-keep-awake` | Only during `running` |
| Haptics | `expo-haptics` | Completion + optional breath taps |
| Persistence | `expo-sqlite` + `expo-sqlite/kv-store` | One storage engine for both the log and settings, works in Expo Go, no extra native module |
| App-wide state | `zustand` (third party, ~1 KB) | Settings + derived progress cache; selector subscriptions avoid needless renders |
| Safe areas / system bars | `react-native-safe-area-context`, `expo-system-ui`, `expo-navigation-bar` | Immersive Practice screen |
| Fonts | System Roboto by default (no bundle cost); `expo-font` only if Q2 picks a custom face | |
| Testing | Jest + `@testing-library/react-native`; reducer & streak logic as pure unit tests | |

Deliberately **not** used: Redux (overkill), react-native-mmkv (needs a dev build for a gain we will not notice at this data size), Lottie (no animation), FlashList (5 rows).

### 3.3 State management for the live countdown

Three layers, each with one job:

```
┌───────────────────────── Practice screen ─────────────────────────┐
│  useSessionTimer(mudraId, plannedSec)                              │
│   ├─ useReducer(sessionReducer)       ← pure, unit-tested FSM      │
│   ├─ useNow(1000) while running       ← 1 s clock, aligned to the  │
│   │                                      next whole second         │
│   ├─ AppState listener                ← background → PAUSE         │
│   ├─ keep-awake on/off by status                                   │
│   ├─ checkpoint to kv-store on each transition                     │
│   └─ on completed/ended → sessionRepo.save() → progressStore.refresh() │
│                                                                    │
│  <CountdownDial remainingMs plannedMs />   re-renders 1×/s         │
│  <BreathCue running rhythm />  shared values only, 0 React renders │
│  <Controls status dispatch />   memoized, renders only on status   │
└────────────────────────────────────────────────────────────────────┘
```

- **Session state is local to the Practice screen** (`useReducer`), not global. Nothing else in the app needs to know the timer ticked, so nothing else re-renders.
- `remainingMs = state.endsAt - now` is computed in render. On resume from background, the first render is already correct because it reads the clock, not a counter.
- `TICK` is dispatched by the 1 s clock. It only changes state at the end, so most ticks only re-render the dial via the `now` value.
- The breath cue is driven entirely by Reanimated shared values. Pausing sets `cancelAnimation`, resuming restarts `withRepeat`. It never touches React state.
- **Global state** (Zustand): `useSettingsStore` (hydrated from kv-store at boot) and `useProgressStore` (today / streak / total, refreshed after each save).

### 3.4 Asset & data layers

```
Bundled, read-only                        On-device, read-write
──────────────────                        ─────────────────────
src/content/mudras.ts  (typed constants)  SQLite: dailymudra.db
assets/mudras/*.webp   (5 × @1x/@2x/@3x)    └─ sessions table
assets/fonts/ (optional)                  kv-store (same DB file)
                                            ├─ settings.*
                                            ├─ home.intent
                                            ├─ duration.<mudraId>
                                            └─ session.inflight (checkpoint)
```

- Mudra content is code, so it is type-checked, tree-shaken and needs no parsing at runtime. Adding a sixth mudra later is one object + one image.
- Images: square, 840×840 source, exported as WebP at 1×/2×/3× and referenced via `require()`, so Metro picks the right density. `expo-image` with `cachePolicy="memory"` and a solid placeholder colour, so there is no layout jump.
- A `sessionRepo` module is the only code that touches SQL (`save`, `getStats`, `reset`), so storage could be swapped later without touching screens.

### 3.5 Proposed directory structure (to confirm in Q5)

```
dailymudra/
├─ app/                         # expo-router routes only (thin)
│  ├─ _layout.tsx               # providers, DB init, theme, stack config
│  ├─ index.tsx                 # Home
│  ├─ welcome.tsx
│  ├─ settings.tsx
│  ├─ mudra/[id].tsx            # Detail
│  └─ practice/[id].tsx         # Practice + Completion
├─ src/
│  ├─ features/
│  │  ├─ library/               # MudraCard, IntentChips, filterByIntent
│  │  ├─ session/               # sessionReducer, useSessionTimer, CountdownDial, BreathCue
│  │  └─ progress/              # sessionRepo, streak.ts, useProgressStore, ProgressStrip
│  ├─ content/mudras.ts         # the 5 mudras
│  ├─ db/                       # open, migrations, kv helpers
│  ├─ theme/                    # tokens.ts (color, type, space, radius), useTheme
│  ├─ ui/                       # Button, Chip, Text, Screen primitives
│  └─ lib/                      # time formatting, a11y helpers
├─ assets/mudras/ · assets/fonts/
├─ docs/SPEC.md
└─ __tests__/ (or colocated *.test.ts)
```

### 3.6 Implementation plan

| Milestone | Scope | Done when |
|---|---|---|
| **M0 Foundations** | Expo app (TypeScript), router, theme tokens from Q1/Q2, UI primitives, lint/format, Jest | App boots to an empty Home on an Android device |
| **M1 Library** | `mudras.ts`, placeholder images, Home list + intent chips, Detail screen | Can browse and filter all 5 mudras with TalkBack |
| **M2 Timer engine** | `sessionReducer` + tests, `useSessionTimer`, dial, pause/resume/end, AppState, keep-awake, checkpointing | Reducer at 100% branch coverage; manual interruption test passes |
| **M3 Persistence** | SQLite schema + migrations, `sessionRepo`, streak logic + tests (midnight, gaps, today-not-yet), progress strip, Completion | Stats correct across simulated days |
| **M4 Breath cue & polish** | Reanimated cue, reduced-motion fallback, haptics, Settings, welcome + disclaimer | 60 fps on a mid-range device; reduced-motion path verified |
| **M5 Release prep** | Final images, a11y audit (font 200%, contrast, TalkBack pass), size/start-up check, EAS build, Play internal testing track | AAB on internal track, budgets in §1.4 met |

---

## Phase 4: Kickoff questions (answer before code)

1. **Colour direction.** For the light screens (Home, Detail, Settings), which mood fits best? (a) *Warm earth*: sand background, terracotta accent, deep brown text. (b) *Cool sage*: off-white, muted sage green accent, slate text. (c) Something you have in mind (a hex or two is enough). The Practice screen will be a deep, low-glare dark tone in every option. Should the whole app also follow the system dark mode, or stay light outside Practice?
2. **Typography.** System Roboto everywhere (zero size cost, best performance), or one bundled display face for headings and mudra names (e.g. a soft serif such as Lora or Fraunces) with Roboto for body text? Do you want Sanskrit names shown in Devanagari, transliteration only, or both?
3. **Session behavior.** Are the presets 3/5/10/15/20 min (plus a 1–60 stepper) right? When the app goes to the background mid-session, should it auto-pause (current spec), or keep counting and show a "session complete" notification at the end (adds the notifications permission)? Any end-of-session sound, or haptic only?
4. **Breath cue.** Is a softly expanding circle inside the timer dial the right visual, or would you prefer a different shape (e.g. a rising/falling line or a glowing ring)? Should the default rhythm be inhale 4 s / exhale 6 s for every mudra, or vary per mudra?
5. **Imagery and structure.** Who will supply the 5 gesture images, and in what style (fine line illustration, flat silhouette, or photography)? I can build with neutral placeholders until they exist. Also: are you happy with the feature-based folder layout in §3.5, or do you prefer a layer-based one (`components/`, `screens/`, `hooks/`)?
