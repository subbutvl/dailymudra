# DailyMudra: Product Specification & UX Architecture

**Status:** Draft v0.3 (wireframe decisions applied; app scaffolded) · **Platform:** Android first (React Native + Expo) · **Backend:** none, fully offline

DailyMudra is a calm, distraction-free companion for practicing hand mudras. A person picks a mudra, reads how to form it, and practices for a set time with a quiet breath-pacing cue. The app remembers how many minutes they have practiced and how many days in a row.

## 0. Constraints this spec is built on

| # | Constraint | How the spec honors it |
|---|---|---|
| C1 | No animation. Gestures are static images. | All gesture visuals are static WebP images. Screen transitions are off (`animation: 'none'`). The time-left label steps once per second; there is no dial. |
| C1a | One exception: a soft looping breath-pacing cue on the Practice screen. | The breath cue is the **only** animated element in the app. It runs on the UI thread and falls back to a non-moving text cue when the system "Remove animations" setting is on. |
| C2 | Exactly 5 bundled mudras: Gyan, Prana, Apana, Vayu, Shunya. | Mudra content is a typed, read-only module compiled into the app. No downloads, no CMS. |
| C3 | High performance, accessible, clean, distraction-free. | No network, no analytics, no ads, no sign-in. TalkBack and font scaling are first-class requirements (see §1.4). |
| C4 | Self-contained, no external backend. | All state lives on device in SQLite (§3.3). |

**Out of scope for v1:** accounts, cloud sync, daily practice reminders, voice/audio guidance, custom mudras, iOS polish, tablets. (A single local "session complete" notification and an end chime **are** in scope, see §1.2.)

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

1. **Timestamp based, not tick based.** The engine stores timestamps, never "seconds remaining decremented by an interval". A JS interval drifts and stops when the app is backgrounded; timestamps do not. Remaining time is always *derived*: `remaining = endsAt - now`.
   - **Clock-change guard.** While the app is in the foreground, every tick compares the wall-clock delta (`Date.now()`) with the monotonic delta (`performance.now()`) since the previous tick. If they disagree by more than 2 s, the device clock was changed, and `startedAt`/`endsAt` are shifted by the difference so the session neither jumps to "completed" nor stretches. In the background no JS runs, so a clock change there cannot be detected; the scheduled end notification uses the same wall clock, so the two at least stay consistent. Accepted for v1.
2. **One pure reducer, one thin hook.** All transitions live in a pure `sessionReducer(state, event)` that is unit tested without React Native. A `useSessionTimer` hook wires it to the clock, `AppState`, keep-awake and persistence.
3. **The screen re-renders at most once per second**, and only the time label subscribes to the tick.

#### State machine

```
            START(durationSec)
   ┌──────┐ ───────────────▶ ┌─────────┐        PAUSE (user only)    ┌────────┐
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
  | { status: 'paused';    mudraId; plannedSec; startedAt; remainingMs; pausedAt; pausedTotalMs }
  | { status: 'completed'; mudraId; plannedSec; practicedSec; startedAt; endedAt }
  | { status: 'ended';     mudraId; plannedSec; practicedSec; startedAt; endedAt };

type SessionEvent =
  | { type: 'START'; mudraId; plannedSec; now }
  | { type: 'PAUSE'; now }           // user only; the app never auto-pauses
  | { type: 'RESUME'; now }          // endsAt = now + remainingMs
  | { type: 'TICK'; now }            // only transitions when now ≥ endsAt
  | { type: 'CLOCK_SHIFT'; deltaMs } // from the clock-change guard; shifts startedAt/endsAt
  | { type: 'END_EARLY'; now }
  | { type: 'RESET' };
```

#### Durations

- Presets on the Detail screen: **3, 5, 10, 15, 20 min**, defaulting to the mudra's `suggestedMinutes` (or the last value the person used for that mudra).
- A small "−/+" stepper allows 1 to 60 min in 1 min steps for anyone who wants a custom length. No free-text input.

#### Interruptions and pauses

**Policy (decided): the session keeps counting no matter what the screen or app does. Only the person can pause it.** Pausing when the screen dims or the person switches apps would break immersion during a long practice.

| Situation | Behavior |
|---|---|
| Person taps Pause | `PAUSE`. Time label freezes, breath cue stops and shows "Paused". The scheduled end notification is cancelled. |
| Resume | `RESUME`. `endsAt = now + remainingMs`; the end notification is rescheduled for the new `endsAt`. |
| Session starts | A local notification "Gyan · 10 minutes complete" is scheduled for `endsAt` (`expo-notifications`, exact-time trigger) on the `session-complete` channel, which carries the chime sound and a gentle vibration pattern. |
| Screen turns off, app switch, call, notification shade (`AppState` → `background`, or Android `blur`) | **Nothing changes.** The timer keeps running from its timestamps; the breath cue simply is not visible. No JS runs in the background; the OS delivers the scheduled notification at `endsAt`. |
| Return to the app before `endsAt` | First render reads the clock, so the time label is already correct. Breath cue restarts. |
| Return to the app after `endsAt` | The first `TICK` sees `now ≥ endsAt` and transitions to `completed` (credited for the full planned time). The notification has already played the chime, so it is dismissed and no second chime plays. |
| Screen would time out while the app is open | Prevented with `expo-keep-awake` while `running`. Released on pause, end and unmount. Brightness is not changed. If the person turns the screen off with the power button, that is fine (see above). |
| Back gesture / hardware back during `running` or `paused` | Opens a small confirm sheet: "End session? You've practiced 4 min." **Keep going** (default, focused) / **End session**. Ending cancels the scheduled notification. |
| Process killed by Android while backgrounded | The session is not lost: it lives in the kv-store checkpoint (`mudraId`, `startedAt`, `endsAt`, `plannedSec`, `pausedTotalMs`, `status`, `elapsedMs`, `checkpointAt`, `appState`) and the notification is held by the OS. On next launch: if `now ≥ endsAt`, the session is recorded as `completed`; if not, the Practice screen reopens and continues running. |
| App crashes while in the foreground | Recovery credits only the last checkpointed `elapsedMs` and records the session as `ended` (never time after the crash). While running, the checkpoint is rewritten every **15 s** and on every transition, so at most 15 s of practice is lost. The pending notification is cancelled. |
| Notification permission denied (Android 13+) | The session works the same; only the background alert is missing. Detail screen shows a one-line hint once: "Allow notifications to hear the chime when the app is in the background." |
| Device clock changed during a session | Handled by the clock-change guard in Principle 1. `practicedSec` is also clamped to `[0, plannedSec]` as a final safety net. |

#### Completion state

- When `now ≥ endsAt` with the app in the foreground, the engine fires `completed`, writes the session row, releases keep-awake, cancels the pending notification, then plays a **soft chime** (bundled ~2 s audio via `expo-audio`, respecting the media volume) followed by **one gentle vibration** (`Haptics.notificationAsync(Success)`). Each can be turned off in Settings. A chime is chosen so someone practicing with closed eyes knows the session ended; the vibration gives silent physical feedback.
- With the app in the background, the scheduled notification delivers the same chime and vibration through its channel.
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

Settings and small UI state (intent filter, durations per mudra, chime/haptics on/off, breath pattern, disclaimer seen, in-flight session checkpoint described in §1.2) live in `expo-sqlite/kv-store`.

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
- Zero network requests. The only runtime permission is `POST_NOTIFICATIONS` (Android 13+), asked the first time the person taps **Start practice**, with a one-line reason. Exact alarms use `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM` as allowed for timer apps; if exact alarms are unavailable the notification may arrive up to a minute late, which is acceptable.
- Fonts: only the weights listed in §2.0 are bundled (4 files, < 300 KB total).

---

## Phase 2: Screen Architecture & UX Flow

### 2.0 Design tokens (decided at kickoff)

#### Colour: "Earthy Harmony" palette

| Token | Hex | Role |
|---|---|---|
| `color.bg` | `#E2DFDA` | Primary app background. Soft warm off-white, no harsh white glare. |
| `color.surface` | `#CBDED3` | Cards, list rows, grouped text blocks, the timer module on light screens, gesture image panel. |
| `color.accent` | `#3B6255` | Primary buttons, selected chips, active states, structural lines of mudra line art. |
| `color.accentMuted` | `#8BA49A` | Secondary icons, dividers, breath circle. **Decorative only on light screens** (see contrast). |
| `color.warm` | `#D2C49E` | Achievements: streak count, completion badge, highlighted element pills (Fire, Air…). Always a **fill** with ink text, never text itself. |
| `color.ink` | `#1F2B27` | *Added.* Primary text. The palette has no text colour; this is a near-black tinted toward the eucalyptus green. |
| `color.inkMuted` | `#4A5652` | *Added.* Secondary text (subtitles, captions). |
| `color.onAccent` | `#FFFFFF` | Text/icons on `accent` buttons. |
| `color.night` | `#14201C` | *Added.* Practice screen background: the eucalyptus green taken almost to black, so the dark screen still belongs to the palette. |
| `color.nightSurface` | `#1C2B26` | *Added.* Raised elements on the Practice screen (sheets, paused buttons). |
| `color.nightText` | `#E2DFDA` | Timer digits and text on Practice (`bg` reused). |

**Palette variants.** All colours live in `src/theme/tokens.ts` as two palettes with the same token names: `calm` (this table, the default) and `vibrant` (cream `#F3EDE0`, mint `#B4E4C9`, emerald `#156B4F`, sage `#4E9A7C`, gold `#E2B84A`, ink `#10261E`, inkMuted `#3C5249`, night `#0B3A2D`, nightSurface `#0F4A39`). Settings → Appearance switches between them so both can be judged on a device. The final choice is still open.

The app stays **light everywhere except the Practice screen**, which is always dark. It does not follow system dark mode in v1 (tokens are structured so a dark theme can be added later).

**Contrast check (WCAG 2.x ratios, computed):**

| Foreground on background | Ratio | Allowed use |
|---|---|---|
| ink on bg / on surface | 11.0 / 10.4 | All text |
| inkMuted on bg / on surface | 5.8 / 5.4 | All text |
| accent on bg / on surface | 5.2 / 4.9 | Text, links, icons, chip outlines |
| white on accent | 6.9 | Button labels |
| ink on warm | 8.5 | Streak/achievement text on sand fill |
| accent on warm | 4.0 | Large text (≥ 18 sp bold / 24 sp) and icons only |
| accentMuted on bg | **2.0** | **Not** for text or meaningful icons; decorative tracks/dividers only |
| warm on bg | **1.3** | Never as text; warm fills need an ink label or accent border |
| nightText on night | 12.6 | Timer digits, all Practice text |
| accentMuted on night | 6.3 | Breath circle, secondary Practice text |
| surface (mint) on night | 11.9 | Breath circle fill (at reduced opacity), icons |
| accent on night | **2.5** | Not used on Practice; too dark |

#### Typography: Outfit + Geist

| Token | Font | Size / line height (sp) | Use |
|---|---|---|---|
| `type.display` | Outfit SemiBold 600 | 64 / 72, tabular figures | Countdown digits |
| `type.h1` | Outfit SemiBold 600 | 28 / 34 | Mudra name on Detail, Completion title |
| `type.h2` | Outfit Medium 500 | 20 / 26 | Mudra name on cards, section titles |
| `type.overline` | Outfit Medium 500 | 13 / 18, +0.8 letter-spacing, caps | Section headers ("HOW TO FORM IT") |
| `type.body` | Geist Regular 400 | 16 / 24 | Steps, benefits, descriptions |
| `type.bodyStrong` | Geist Medium 500 | 16 / 24 | Buttons, chips, emphasis |
| `type.caption` | Geist Regular 400 | 13 / 18 | Element tags, meta |

- Bundled weights only: Outfit 500 + 600, Geist 400 + 500 (from `@expo-google-fonts/outfit` and `@expo-google-fonts/geist`, loaded with `expo-font` before the splash hides).
- **Timer digits:** use `fontVariant: ['tabular-nums']`. If Outfit's figures turn out not to be tabular on Android, each digit is rendered in a fixed-width box so `08:42` → `08:41` never shifts horizontally. Verify in M0.
- **Sanskrit names:** shown as transliteration (in Outfit) plus Devanagari as a subtitle. Neither Outfit nor Geist has Devanagari glyphs, so Devanagari falls back to the system Noto Sans Devanagari, which is fine for a subtitle.
- All sizes are `sp`, so they scale with the system font setting.

#### Spacing, radius, elevation

- Spacing scale (dp): 4, 8, 12, 16, 24, 32, 48. Screen gutter 24.
- Radius: 12 for cards and image panels, 999 for chips and the primary CTA, 16 for sheets.
- No drop shadows; surfaces are separated by `surface` colour on `bg`, which keeps the look flat and calm.

#### Gesture imagery

- Style: minimalist **line art** of the hand, strokes in `accent #3B6255` on a `surface #CBDED3` panel. Fingers that carry the gesture's elements may be filled with `warm #D2C49E` at low opacity.
- Delivered as SVG source, exported to WebP (see §3.4). Generated later with an AI image tool.
- **Until then, placeholders:** a `surface` rounded panel containing the mudra's initial ("G", "P", "A", "V", "S") in Outfit 600, `accent` colour, plus a thin `accentMuted` ring. Same size and alt text as the final image, so swapping in real art changes no layout.

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

- `bg` canvas, cards on `surface`, selected chip filled `accent` with white label, unselected chips outlined `accent`. The streak figure sits on a small `warm` pill. One column, 24 dp gutters, no bottom tab bar (only one primary destination).
- First-ever launch: the progress strip reads "Your practice starts today" instead of zeros.
- TalkBack order: title → settings → progress strip (read as one sentence, "12 minutes today, 4 day streak, 186 minutes total") → chips → sections.
- Implementation: a plain `ScrollView` with sections. Virtualised lists are unnecessary for five rows and cost startup time.

### 2.3 Mudra Detail (flip card, decided on the wireframes)

```
┌────────────────────────────────────┐
│ ‹                                  │
│ ┌────────────────────────────────┐ │  FRONT of the card: the gesture image,
│ │                                │ │  full width, square, on `surface`.
│ │         gesture image          │ │
│ │                                │ │  BACK of the card ("How to form it"):
│ └────────────────────────────────┘ │  numbered steps + "Traditionally
│          ↻ How to form it          │  associated with" bullets. Grows with
│                                    │  its text (no truncation at 200% font).
│ Gyan Mudra                         │  H1
│ ज्ञान मुद्रा · Gesture of knowledge  │  subtitle, muted
│ ELEMENTS                           │
│ [Index · Air] [Thumb · Fire]       │  warm pills, ink text
│ ⓘ caution (only if the mudra has one)
├────────────────────────────────────┤  ← sticky footer (always visible)
│ (3)(5)[10](15)(20)     − 10m +     │  preset chips + 1–60 stepper
│ [        Start practice          ] │  Primary CTA, 56dp
└────────────────────────────────────┘
```

- Tapping the card or the "How to form it" link flips it. Per C1 the flip is an **instant face swap**, not a rotation.
- Duration choice is remembered per mudra. Notification permission is asked on the first **Start practice**.

### 2.4 Active Practice (dark, eyes-open)

Practice is eyes-open: the person must **see** the gesture, so the image is the hero (decided on the wireframes; replaces the earlier big-dial layout).

**Running**
```
┌────────────────────────────────────┐  background: night, status bar hidden
│ ✕                        Gyan      │  ✕ = End (opens confirm sheet)
│ ┌────────────────────────────────┐ │
│ │                                │ │
│ │                                │ │  Gesture image, ~70% of the screen
│ │         gesture image          │ │  (nightSurface panel)
│ │                                │ │
│ │                                │ │
│ └────────────────────────────────┘ │
│  ◯  Inhale                         │  small breath circle (56dp) + phase word
│  08:42 left            [❚❚ Pause]  │  subtle time-left label + pause/play
└────────────────────────────────────┘
```

- **Breath cue (decided):** a small soft circle, *inhale 4 s → exhale 6 s*, looping, the same for all 5 mudras. Scales 0.6 → 1.0 with an ease-in-out curve, filled `surface` at 0.35 to 0.6 opacity. With "Remove animations" on it is a still circle and only the word changes.
- The time label is muted (`nightMuted`), tabular figures, and is not a live region; TalkBack hears "8 minutes 42 seconds left" on focus plus a polite announcement each whole minute.
- "Show gesture image in practice" can be turned off in Settings for those who know the pose.
- Nothing else moves. No progress percentages, no quotes, no streak reminders during practice.

**Paused**
```
│  ◯  Paused                         │  breath circle still
│  08:42 left     [End] [▶ Resume]   │  Resume = primary, End = secondary
```
The app never pauses on its own (see §1.2), so "Paused" only ever follows the person's own tap.

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
│ Chime on completion        [ ● ]   │
│ Vibrate on completion      [ ● ]   │
│ Notifications           Allowed ›  │  opens system settings if denied
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
6. Follow the breath cue; the screen turns off or a call comes in → the timer keeps running.
7. Timer reaches 0 → soft chime + one vibration (as a notification if the app is in the background) → Completion shows the updated streak.
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
| Breath cue | `react-native-reanimated` (`withRepeat`, `useReducedMotion`) | Runs on the UI thread, so the JS 1 s tick cannot stutter it |
| Keep screen on | `expo-keep-awake` | Only during `running` |
| Haptics | `expo-haptics` | Completion + optional breath taps |
| End-of-session alert | `expo-notifications` (local only, no push service) | Scheduled at `endsAt`, delivered by the OS even if the app is backgrounded or killed |
| Chime | `expo-audio` | Plays the bundled chime when completion happens in the foreground |
| Persistence | `expo-sqlite` + `expo-sqlite/kv-store` | One storage engine for both the log and settings, works in Expo Go, no extra native module |
| App-wide state | `zustand` (third party, ~1 KB) | Settings + derived progress cache; selector subscriptions avoid needless renders |
| Safe areas / system bars | `react-native-safe-area-context`, `expo-system-ui`, `expo-navigation-bar` | Immersive Practice screen |
| Fonts | `expo-font` + `@expo-google-fonts/outfit`, `@expo-google-fonts/geist` | Outfit for headings/digits, Geist for body (§2.0) |
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
│   ├─ clock-change guard (wall vs monotonic) → CLOCK_SHIFT          │
│   ├─ AppState listener   ← only to restart the breath cue on return│
│   ├─ keep-awake on/off by status                                   │
│   ├─ schedule / cancel end notification on START, PAUSE, RESUME, END│
│   ├─ checkpoint to kv-store on each transition + every 15 s        │
│   └─ on completed/ended → sessionRepo.save() → progressStore.refresh() │
│                                                                    │
│  <TimeLeft remainingMs />   re-renders 1×/s                        │
│  <BreathCue running rhythm />  shared values only, 0 React renders │
│  <Controls status dispatch />   memoized, renders only on status   │
└────────────────────────────────────────────────────────────────────┘
```

- **Session state is local to the Practice screen** (`useReducer`), not global. Nothing else in the app needs to know the timer ticked, so nothing else re-renders.
- `remainingMs = state.endsAt - now` is computed in render. On resume from background, the first render is already correct because it reads the clock, not a counter.
- `TICK` is dispatched by the 1 s clock. It only changes state at the end, so most ticks only re-render the time label via the `now` value.
- The breath cue is driven entirely by Reanimated shared values. Pausing sets `cancelAnimation`, resuming restarts `withRepeat`. It never touches React state.
- **Global state** (Zustand): `useSettingsStore` (hydrated from kv-store at boot) and `useProgressStore` (today / streak / total, refreshed after each save).

### 3.4 Asset & data layers

```
Bundled, read-only                        On-device, read-write
──────────────────                        ─────────────────────
src/content/mudras.ts  (typed constants)  SQLite: dailymudra.db
assets/mudras/*.webp   (5 × @1x/@2x/@3x)    └─ sessions table
assets/sounds/chime.ogg (also android res  kv-store (same DB file)
  /raw for the notification channel)
                                            ├─ settings.*
                                            ├─ home.intent
                                            ├─ duration.<mudraId>
                                            └─ session.inflight (checkpoint)
```

- Mudra content is code, so it is type-checked, tree-shaken and needs no parsing at runtime. Adding a sixth mudra later is one object + one image.
- Images: square, 840×840 source, exported as WebP at 1×/2×/3× and referenced via `require()`, so Metro picks the right density. `expo-image` with `cachePolicy="memory"` and a solid placeholder colour, so there is no layout jump.
- A `sessionRepo` module is the only code that touches SQL (`save`, `getStats`, `reset`), so storage could be swapped later without touching screens.

### 3.5 Directory structure (feature-based)

```
dailymudra/
├─ src/
│  ├─ app/                      # expo-router routes only (thin; SDK 58 default location)
│  │  ├─ _layout.tsx            # fonts, DB init, checkpoint recovery, stack config
│  │  ├─ index.tsx              # Home
│  │  ├─ welcome.tsx
│  │  ├─ settings.tsx
│  │  ├─ mudra/[id].tsx         # Detail (flip card)
│  │  └─ practice/[id].tsx      # Practice + Completion
│  ├─ features/
│  │  ├─ library/               # MudraCard, IntentChips, filterByIntent
│  │  ├─ session/               # sessionReducer, useSessionTimer, BreathCue, checkpoint, notifications
│  │  └─ progress/              # sessionRepo, streak.ts, useProgressStore, ProgressStrip
│  ├─ content/mudras.ts         # the 5 mudras
│  ├─ db/                       # open, migrations, kv helpers
│  ├─ settings/                 # useSettings (zustand, persisted to kv-store)
│  ├─ theme/                    # tokens.ts (palettes, type, space, radius), useTheme
│  ├─ ui/                       # Button, Chip, Text, Screen primitives
│  └─ lib/                      # time formatting, a11y helpers
├─ assets/mudras/ · assets/sounds/   (fonts come from @expo-google-fonts packages)
├─ docs/SPEC.md
└─ __tests__/ (or colocated *.test.ts)
```

### 3.6 Implementation plan

| Milestone | Scope | Done when |
|---|---|---|
| **M0 Foundations** | Expo app (TypeScript), router, theme tokens + fonts from §2.0 (verify tabular digits), UI primitives, lint/format, Jest | App boots to an empty Home on an Android device |
| **M1 Library** | `mudras.ts`, initial-letter placeholders (§2.0), Home list + intent chips, Detail screen | Can browse and filter all 5 mudras with TalkBack |
| **M2 Timer engine** | `sessionReducer` + tests, `useSessionTimer`, time label, pause/resume/end, clock-change guard, keep-awake, end notification + chime, checkpointing + recovery | Reducer at 100% branch coverage; manual tests pass: screen off, app switch, process killed in background, clock changed |
| **M3 Persistence** | SQLite schema + migrations, `sessionRepo`, streak logic + tests (midnight, gaps, today-not-yet), progress strip, Completion | Stats correct across simulated days |
| **M4 Breath cue & polish** | Reanimated cue, reduced-motion fallback, haptics, Settings, welcome + disclaimer | 60 fps on a mid-range device; reduced-motion path verified |
| **M5 Release prep** | Final images, a11y audit (font 200%, contrast, TalkBack pass), size/start-up check, EAS build, Play internal testing track | AAB on internal track, budgets in §1.4 met |

---

## Phase 4: Kickoff decisions (answered 2026-11-17)

| # | Topic | Decision | Where in spec |
|---|---|---|---|
| 1 | Colour | "Earthy Harmony" palette with the role mapping given; light app, dark Practice screen. Text and night tokens added and contrast-checked. | §2.0 |
| 2 | Typography | Outfit for headings, mudra names and timer digits; Geist for body text. | §2.0 |
| 3 | Sessions | Presets 3/5/10/15/20 + 1–60 stepper. Timer keeps counting in the background, local notification at the end. Soft chime then gentle vibration. | §1.2 |
| 4 | Breath cue | Small expanding/shrinking circle below the gesture image, 4 s in / 6 s out for all 5 mudras. | §2.4 |
| 5 | Imagery & folders | Minimalist line art in `#3B6255` on `#CBDED3`, made later; typographic-initial placeholders until then. Feature-based folders. | §2.0, §3.5 |

Assumptions made where the answers were silent (easy to change):
- Sanskrit names show transliteration plus a Devanagari subtitle in the system font.
- The app does not follow system dark mode in v1.
- Users can still turn off the chime or vibration in Settings.

## Changelog

- **v0.3** – Detail is a flip card (instant swap). Practice puts the gesture image first (~70% of the screen) with a small breath circle, a subtle time-left label and pause/play; the dial is dropped. Calm and vibrant palettes both live in theme tokens. Routes moved to `src/app/` (Expo SDK 58 default).
- **v0.2** – Applied kickoff decisions. Timer no longer auto-pauses; added end notification, chime, clock-change guard (wall vs monotonic), 15 s checkpoints and background-kill recovery (from review on PR #1). Added design tokens, contrast table and placeholder spec.
- **v0.1** – Initial spec, wireframes and plan.
