# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

MAXX — a gamified habit/addiction-recovery Expo (React Native + TypeScript) app: Duolingo-style level path, XP/credits/streaks, community feed, and a crisis-support (SOS) screen. This build ships only the **Addictions & Habit Recovery** track; the content model is data-driven so a second/third track can be added without touching screen or navigation code.

## Commands

```bash
npm install
cp .env.example .env      # fill in Supabase URL/anon key (+ Google OAuth client IDs, optional)
npm run ios                # or: npm run android / npm run web
```

There is no lint or JS unit-test script in `package.json`. Type-check with `npx tsc --noEmit`.

### Supabase (backend)

- Migrations live in `supabase/migrations/`, applied in numeric order (`0001_init.sql` → `0004_security_hardening.sql`). Apply via the Supabase SQL editor or `supabase db push`.
- Edge Functions (`supabase/functions/`) deploy with `supabase functions deploy <name>` (e.g. `delete-account`, `complete-level`).
- **RLS isolation test suite**: `./supabase/tests/run.sh` — spins up a throwaway local Postgres DB, runs every migration plus a shim of Supabase's `auth` schema, then asserts cross-user data isolation, SOS region filtering, block enforcement, duplicate-report guards, server-side content policy, and rate limits. Requires a local `psql`/reachable Postgres; no Docker or live Supabase project needed. **Run this after any migration touching RLS, grants, or new per-user tables**, and add new assertions to `supabase/tests/20_isolation_assertions.sql` for new tables.

### Web preview (not the real target platform)

`netlify.toml` builds `npx expo export --platform web` for a quick visual preview via react-native-web. Needs `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` as Netlify env vars or only Splash → Goal Selection → Personalization → Sign-up will work. Sign in with Apple, the iOS widget, and push notifications never work on web.

### iOS widget (needs a Mac/Xcode, cannot be exercised in this environment)

`targets/widget` is a WidgetKit extension via `@bacons/apple-targets`, only built during a native prebuild (not Expo Go): set `ios.appleTeamId` in `app.json`, `npx expo prebuild -p ios --clean`, then build the widget target in Xcode.

## Path aliasing

`@/*` maps to `src/*` (configured in both `tsconfig.json` and `babel.config.js` via `babel-plugin-module-resolver`) — always import with `@/...`, not relative `../../` chains.

## Architecture

### Content model (`src/content/`, `src/types/content.ts`)

Content is **data, not code**: `Track → HabitCategory → Level`.
- Only the `addictions` track is `available` in this build; others render "Coming soon."
- A `Level` is one of three typed content shapes: `lesson`, `exercise`, `documentation`.
- Per-category level definitions live in `src/content/levels/*.ts` (doomscrolling, food, vaping, smoking, alcohol, drugs, plus `general.ts` for free-text "Other" entries).
- `generatePath()` (`src/content/index.ts`) round-robin-interleaves each selected category's levels so early progress touches every habit the user picked, rather than clearing one category before starting the next.
- Adding a new track later = new data + `available: true`, no screen/navigation changes.

### State (`src/store/appStore.ts`, `src/store/authStore.ts`) via Zustand

`appStore` holds profile, progress, gamification state, categories, and the generated path; it drives all data loading through `loadForUser()` and mutations through action methods that call `src/api/*.ts` then re-derive state. It has a fully client-side **demo mode** (`enterDemoMode`/`isDemo`) that bypasses Supabase entirely with in-memory fake data — check `isDemo` branches when touching `completeLevel` or similar mutation paths, since demo mode computes rewards client-side while real users never do (see below).

### Gamification is server-authoritative — do not move logic back to the client

`src/utils/gamification.ts` has the streak/freeze math (`applyActiveDay`, `maybeAwardStreakFreeze`) used for local/demo simulation, but for real users **`supabase/functions/complete-level` is the sole writer of `gamification_state` and `level_progress`**, using the service-role key; XP/credit values are derived server-side from the level id (`supabase/functions/_shared/levelRewards.ts`), never trusted from the request body. This was a deliberate security fix (see `SECURITY.md` §4) after `gamification_state` was found directly writable by clients. The client (`completeLevel` in `appStore.ts`) only reports "I finished this level" and reflects back whatever the server decided. Streak logic: increments on a consecutive day, auto-consumes a streak freeze if exactly one day was missed (capped at 3 stored, earns one back every 7-day milestone), resets if 2+ days missed with none available.

### Community moderation (spec §6 / Apple UGC requirements)

- `checkPostText()` (`src/utils/contentFilter.ts`) is a client-side pre-filter only — `0004_security_hardening.sql` adds a real server-side `BEFORE INSERT/UPDATE` trigger enforcing the same policy (empty text, phone numbers) on `community_posts` and `sos_broadcast_replies`, since the client filter is trivially bypassable.
- Reporting a post auto-hides it after 3 reports pending human review (`on_report_created` trigger).
- Blocking is enforced in Postgres RLS, so blocked authors' posts/SOS broadcasts are filtered server-side, not just client-side.

### SOS safety design (spec §7 — non-negotiable)

The SOS screen (`src/screens/sos/SosScreen.tsx`) always shows a fixed crisis banner with one-tap-to-call regional resources (`src/content/crisisResources.ts`) **above** the peer-support broadcast; the broadcast copy explicitly says it isn't a substitute. Don't reorder this without re-reading spec §7. Broadcasting is two-way: a broadcaster can cancel their own request, and nearby users see a "Nearby, right now" list (`getOtherActiveLocalBroadcasts`) they can reply to (`sos_broadcast_replies`, migration `0002`).

### Security posture

`SECURITY.md` is the authoritative status log of the RLS/anti-cheat hardening pass — read it before changing anything touching auth, RLS policies, gamification writes, or content moderation triggers, and update it if the security posture changes. Key invariants it documents: RLS enabled + default-deny on every table; `gamification_state`/`level_progress` are read-only for clients; sessions live in the platform keychain via `expo-secure-store` on native (`src/api/secureSessionStorage.ts`) and `AsyncStorage` only on web (no keychain equivalent there); every DB call goes through the parameterized Supabase JS query builder, no raw SQL.

### Design system

Dark-only ("Nocturne": near-black, single blurple accent), Inter typeface, "3D lip" elevation on buttons/path nodes — defined in `src/theme/colors.ts` and `src/theme/index.ts`. `userInterfaceStyle` is forced to `"dark"` in `app.json`. Two deliberate exceptions to the "no second hue" rule: `theme.colors.sos` (red, for the SOS banner/call buttons — a safety convention) and quiz right/wrong feedback in Lesson levels (green/red, for at-a-glance correctness). Reference screens with hearts/lives/leaderboards were style-reference only — MAXX has no hearts or leaderboard system.

### iOS widget data bridge

`src/widgets/widgetData.ts` (`syncWidgetData`) pushes XP/streak/credits to the widget via `ExtensionStorage` writing to a shared App Group, called from `appStore` whenever gamification state changes. The Swift side (`targets/widget/MaxxWidget.swift`) reads that shared storage; it hasn't been compiled/run in this environment (no Xcode/Mac available here).

## Expo version note

This project targets **Expo SDK 57**, which is newer than older training data may assume. Check https://docs.expo.dev/versions/v57.0.0/ for exact API/config shape before writing Expo-specific code (e.g. `app.json` fields, `expo-*` package APIs).
