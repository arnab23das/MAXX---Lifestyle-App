# MAXX

A gamified habit- and addiction-recovery app (Duolingo-style level path, XP/credits/streaks, community, and an SOS crisis-support screen). This build ships the **Addictions & Habit Recovery** track only; the data model is modular so a second and third track can be added later as content, not a rebuild.

## Stack

- **Expo (React Native) + TypeScript**, targeting iOS primary / Android secondary from one codebase.
- **Supabase** for auth (email, Apple, Google), Postgres storage, row-level security, and an Edge Function for account deletion.
- **Zustand** for client state (`src/store`).
- **React Navigation** (native-stack + bottom-tabs).
- **@bacons/apple-targets** for the iOS home/lock-screen widget (WidgetKit extension).

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run ios            # or: npm run android / npm run web
```

### Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` against it (via the SQL editor or `supabase db push`).
3. Deploy the account-deletion Edge Function: `supabase functions deploy delete-account`.
4. Enable email auth, and configure Apple / Google as OAuth providers in Supabase Auth settings (you'll need your own Apple Services ID and Google OAuth client — see `.env.example` for the Google client ID vars).
5. Put your project URL and anon key in `.env`.

### Deploying a web preview to Netlify

This is a React Native app, not a web app, but Expo can also export it as a static site (via react-native-web) — useful for a quick visual preview without a simulator. `netlify.toml` at the repo root is already set up for this: build command `npx expo export --platform web`, publish directory `dist`.

1. In Netlify, create a new site from this repo/branch — it'll pick up `netlify.toml` automatically.
2. Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` as Netlify environment variables (Site settings → Environment variables) so sign-up/sign-in actually work. **Without them, the app still renders** (it falls back to a placeholder client rather than crashing — see `src/api/supabase.ts`), but every screen past sign-up requires a real backend, so you'll only be able to look at Splash → Goal Selection → Personalization → Sign-up.
3. A few things won't work on web regardless of backend, since they're native-only: Sign in with Apple (hidden automatically on non-iOS), the iOS widget (irrelevant on web), and push notifications.

### iOS widget (optional, needs a Mac)

The `targets/widget` folder defines a WidgetKit extension via `@bacons/apple-targets`, showing streak/level/credits on the home and lock screen. It only builds as part of a native iOS build (not Expo Go):

1. Set `ios.appleTeamId` in `app.json` (from Xcode → Signing & Capabilities).
2. `npx expo prebuild -p ios --clean`
3. Open `ios/*.xcworkspace` in Xcode, select the widget target, and build.

The app pushes data to the widget automatically via `src/widgets/widgetData.ts` whenever XP/streak/credits change (`ExtensionStorage` writes to a shared App Group; see `targets/widget/MaxxWidget.swift`).

## Architecture

### Content model (`src/content`, `src/types/content.ts`)

Content is modeled as **Track → HabitCategory → Level(type, content)**, entirely as data (not code):

- A `Track` is a top-level goal (only `addictions` is `available` in this build; the other two render as "Coming soon" per spec).
- A `HabitCategory` is one item in the personalization checklist (doomscrolling, food, vaping, smoking, alcohol, drugs, or a free-text "Other").
- A `Level` belongs to one or more categories and is one of three types — `lesson`, `exercise`, `documentation` — each with its own typed `content` shape.
- `generatePath()` (`src/content/index.ts`) merges each selected category's levels into the user's path by round-robining two-level chunks per category (not one level at a time), so early progress still touches every habit the user picked, but same-type levels from different categories (e.g. three lessons, or three real-world exercise tasks, back to back) don't stack up and overwhelm the user when multiple addictions are combined.

Adding **Track 2 or 3** later means adding new `Track`/`HabitCategory`/`Level` data and marking the track `available: true` — no screen or navigation code changes.

### Gamification (`src/utils/gamification.ts`, `src/store/appStore.ts`)

Completing a level grants XP + credits and calls `applyActiveDay()`, which:
- increments the streak on a consecutive day,
- **auto-consumes a streak freeze** if exactly one day was missed (resolved decision: streak-freeze safety net, capped at 3 stored freezes, earning one back every 7-day streak milestone),
- resets the streak if 2+ days were missed with no freeze available.

### Community moderation (spec §6 / Apple UGC requirements)

- `checkPostText()` (`src/utils/contentFilter.ts`) is a client-side pre-filter; wire the `BLOCKED_TERMS` list to a hosted moderation list or API before launch.
- Reporting a post (`reports` table) auto-hides it after 3 reports pending human review (see the `on_report_created` trigger in the migration).
- Blocking (`blocks` table) is enforced in Postgres RLS policies, so blocked authors' posts/SOS broadcasts are filtered server-side, not just client-side.

### SOS safety design (spec §7 — non-negotiable)

The SOS screen always shows a fixed crisis banner with one-tap-to-call regional crisis resources (`src/content/crisisResources.ts`) **above** the peer-support broadcast, and the broadcast copy explicitly says it's not a substitute for those resources. Do not reorder this without re-reading §7 of the spec.

Broadcasting is a real two-way loop, not a one-off ping: a broadcaster can cancel their own request, and other nearby users see a "Nearby, right now" list (`getOtherActiveLocalBroadcasts`) they can reply to with a word of support (`sos_broadcast_replies` table, migration `0002`).

## Design system

The visual language (color, typography, elevation, radii) matches the `design_handoff_maxx_app` UI reference: a dark, near-black, single-blurple-accent ("Nocturne") palette, Inter typeface, and the signature "3D lip" elevation on buttons and path nodes (`src/theme/colors.ts`, `src/theme/index.ts`).

Two intentional exceptions to the reference's "mono, no second hue" rule:
- The SOS crisis banner and call buttons use a distinct red (`theme.colors.sos`) — a safety convention that shouldn't be diluted into the accent color.
- Quiz right/wrong feedback in Lesson levels uses green/red — needed for at-a-glance correctness, not decorative.

The reference's own example screens (goal cards for "cutting/bulking/quitting," hearts, a local leaderboard/league) were used for **style only** — MAXX's actual scope is the Addictions track from this spec (§2), with no hearts/lives or leaderboard system.

The app forces dark mode (`userInterfaceStyle: "dark"`) since the reference is a single-theme design, not a light/dark pair.

## App Store readiness

Already built in:
- Account deletion (`AccountDeletionScreen` → `delete-account` Edge Function, cascades via FK `on delete cascade`).
- Sign in with Apple offered alongside Google (required by Apple when offering third-party login).
- UGC moderation stack: EULA acknowledgment at sign-up, content filtering, reporting, blocking, auto-hide-at-threshold.
- Privacy Policy / Terms of Use screens (`src/content/legal.ts`) — **placeholder legal text; have an attorney review before submission.**

Still needed before submission (can't be done from this codebase alone):
- Set a real `ios.bundleIdentifier` / `android.package` (currently `com.maxx.app` placeholders) and `ios.appleTeamId`.
- Fill out Apple's Privacy Nutrition Labels in App Store Connect from the data collection described in the Privacy Policy.
- Set the age rating in App Store Connect — references to drugs/alcohol/smoking and open community messaging likely push this to 17+.
- Real Apple Services ID + Google OAuth client credentials (`.env`, Supabase Auth provider config).
- A moderation team process for acting on `reports` within ~24 hours (the schema and auto-hide are in place; the human process isn't).

## Known gaps / follow-ups

- Google Sign-In is fully wired (SignUp screen → `useGoogleSignInRequest()` → `signInWithGoogleIdToken()`), but needs real Google OAuth client IDs to actually authenticate (see `.env.example`); without them the button shows a setup prompt instead of failing silently.
- The iOS widget extension (Swift) hasn't been compiled or run — it needs Xcode/a Mac, which this environment doesn't have. The JS-side data bridge (`syncWidgetData`) is wired into every XP/streak change.
- Content currently covers 5 levels per fixed habit category (doomscrolling, food, vaping, smoking, alcohol, drugs) plus a 3-level generic set for custom "Other" entries — enough to demonstrate and use the full loop, not an exhaustive curriculum.
