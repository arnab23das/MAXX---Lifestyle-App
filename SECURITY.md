# MAXX Security Hardening — Status

Audited and hardened July 2026. Maps to the "MAXX Security Hardening
Checklist & Prompt" Section A, item by item. Every item below is either
**Done** (with file location), **Partial** (done in code, needs a console
step to finish), or **N/A** (with the reason — a feature that doesn't exist,
or a concern that doesn't apply to this architecture).

There is no separate API server in this app — Supabase (Postgres + Auth +
Edge Functions) *is* the backend, and Postgres Row Level Security is the only
real trust boundary every client request passes through. That shapes several
of the answers below: rate limiting and server-side validation live in
Postgres triggers and Edge Functions rather than API middleware, because
there is no other place for them to live.

## How to verify this yourself

```
./supabase/tests/run.sh
```

Runs a real, automated proof (not a description) that user A cannot read or
write user B's journals, progress, gamification state, emergency contacts,
profile, or custom habit categories, plus checks for the SOS region filter,
block enforcement, duplicate-report guard, server-side content policy, and
posting rate limits. It applies the actual migration files in
`supabase/migrations/` against a throwaway local Postgres database (no Docker
or live Supabase project needed) and asserts against the real RLS policies —
see `supabase/tests/README.md`. 21/21 assertions currently pass; the same
suite run against the pre-hardening schema (before `0004_security_hardening.sql`)
correctly fails 4 of them, which is what this pass fixed.

---

## 1. Secrets & configuration

| Item | Status |
|---|---|
| Repo scanned for hardcoded secrets (incl. git history) | **Done.** No API keys, service-role keys, tokens, or credentials found anywhere in the working tree or commit history (`.env` was never committed — checked with `git log --all --full-history -- .env`). |
| Secrets in environment variables / secret manager | **Done.** Client env vars (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, Google client IDs) are the only values baked into the client bundle, and all are meant to be public (see next row). The Supabase service-role key is read only inside Edge Functions via `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` (`supabase/functions/delete-account/index.ts`, `supabase/functions/complete-level/index.ts`) — it never ships to the client. |
| `.env` / keystores / service-account files in `.gitignore` | **Done.** `.gitignore` already covers `.env`, `.env*.local`, `*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`. |
| Client-side keys (Supabase URL/anon key) safe only if RLS + App Check make them useless | **Done** for RLS (see §3 below and the test suite). App Check / attestation is a console step — see **B5** in the manual list. |

## 2. Authentication & sessions

| Item | Status |
|---|---|
| Email verification before community/messaging unlocks | **Partial.** Governed by Supabase Auth's "Confirm email" project setting — when enabled, `signUp()` returns no session until the address is confirmed, and `SignUpScreen.tsx` already handles that (shows a "check your email" message instead of silently proceeding). Verify this setting is ON in the Supabase dashboard (**B4**). |
| Password policy: 8+ chars, breach-list check, Apple/Google sign-in | **Done** for length (`SignUpScreen.tsx` now requires 8, was 6) and social sign-in (`src/api/auth.ts` — Apple via `expo-apple-authentication`, Google via `expo-auth-session`, both already wired to `signInWithIdToken`). Breached-password checking is a Supabase Pro "leaked password protection" console toggle — **B4/manual**, not app code. |
| Secure session handling: short-lived tokens, refresh rotation, server-side revocation on password change / deletion | **Done** for deletion (`supabase/functions/delete-account` — `admin.deleteUser` revokes all sessions). Token lifetime and refresh-token-rotation are Supabase Auth project settings, not app code — verify "Refresh token rotation" is enabled (**B4**). There is currently no in-app password-change flow (only sign-up/sign-in) — recommend adding one via `supabase.auth.updateUser({ password })`, out of scope for this pass. |
| Rate-limit + backoff on login/signup/reset | **N/A / Partial.** There is no separate API layer to put a rate limiter in front of — Supabase's own Auth server (GoTrue) enforces rate limits on these endpoints itself, independent of app code. Recommend enabling CAPTCHA (hCaptcha/Turnstile) on auth forms in the Supabase dashboard for stronger bot protection (**B4**). |
| Password reset doesn't reveal user existence | **N/A.** No password-reset flow exists in the app yet (`grep` for `resetPassword`/`forgotPassword` returns nothing). If added, `supabase.auth.resetPasswordForEmail()` already returns success regardless of whether the address exists — no enumeration risk to introduce as long as the UI doesn't add its own "no account found" branch. |
| CSRF protection on state-changing endpoints | **N/A.** The app authenticates via `Authorization: Bearer <JWT>` headers (Supabase JS default), not cookies — CSRF requires an ambient credential (cookies) automatically attached by the browser; there is none here, on native or web. |

## 3. Authorization

| Item | Status |
|---|---|
| Every read/write checked server-side, not just client-side | **Done.** All tables have RLS enabled with owner-scoped policies (`supabase/migrations/0001_init.sql` onward); `gamification_state` and `level_progress` are now read-only for clients entirely (`0004_security_hardening.sql`) — see §4. |
| Users can only read/write their own profile, journals, habit selections, progress, XP/credits, streaks, SOS contacts | **Done** — enforced by RLS policies (`profiles_select_own`/`_update_own`, `journal_owner_all`, `custom_categories_owner_all`, `level_progress_owner_select`, `gamification_owner_select`, `contacts_owner_all`), proven by the automated suite (§ above). |
| Community posts: readable by intended audience, writable by author, deletable by author + moderators | **Done** for author-only write/delete (`posts_insert_own`, `posts_delete_own`) and visibility (`posts_select_visible` excludes hidden posts and blocked authors). "Deletable by moderators" has no moderator role/UI yet — see **B8** (manual moderation duty) and the `reports` table's auto-hide-at-3 mechanism, which is the current moderation lever. |
| Direct messages readable/writable only by the two participants | **N/A.** There is no general DM feature — the closest analog is SOS broadcast replies (`sos_broadcast_replies`), which are visible to anyone who can see the broadcast itself (by design — it's a support broadcast, not a private DM) and writable only by their own author (`sos_replies_insert`). |
| Automated tests proving cross-user isolation | **Done** — `supabase/tests/` (see "How to verify this yourself" above). 21 assertions covering journals, progress, gamification, contacts, profiles, custom categories, SOS region filtering, blocks, duplicate reports, content policy, and rate limits. |
| Default-deny for anything not explicitly covered | **Done.** RLS is enabled on every table in the schema; Postgres RLS defaults to deny when no policy matches a given command, which is exactly what's exploited (correctly) by `gamification_state`/`level_progress` now having no write policy at all for clients. |

## 4. Anti-cheat / gamification integrity

| Item | Status |
|---|---|
| XP/credits/streaks computed server-side, not trusted from the client | **Done.** This was the most serious real finding in this pass: `gamification_state` was previously writable directly by any authenticated client (`for all using (auth.uid() = user_id)` — a user could set their own xp/credits to anything by editing outgoing requests). Fixed in `0004_security_hardening.sql` (read-only RLS) + `supabase/functions/complete-level/index.ts` (new Edge Function, the only writer, using the service-role key). The reward for a given level is derived independently server-side from the level id's chapter position (`supabase/functions/_shared/levelRewards.ts`), never trusted from the request body. |
| Level-completion plausibility checks (reject impossibly fast/frequent completions) | **Done, partially.** `complete-level` rejects completing the same level twice (checks `level_progress.status`, and `level_progress` is now also read-only for clients — see the note below) and caps completions to 20/minute per user (`MAX_COMPLETIONS_PER_MINUTE` in the same file). It does **not** validate that a level was actually the next unlocked one in the user's path (full path-order validation would require duplicating the client's path-generation logic server-side for marginal benefit — completing levels "out of order" still only pays each level's fixed, capped reward once, so there's no economic exploit from it, just a minor consistency gap). Flagged here as a known, accepted limitation rather than silently skipped. |

**Important related fix:** `level_progress` (which levels are marked "completed") was still directly writable by clients even after gamification_state was locked down. That's a real chained exploit: a user could complete a level normally (get XP), then directly `UPDATE level_progress SET status = 'unlocked'` on their own row (allowed under the old `level_progress_owner_all` policy), then call `complete-level` again to farm XP on the same level repeatedly. `0004_security_hardening.sql` locks `level_progress` to read-only for clients too, for the same reason as gamification_state — see the "anti-XP-farming" assertions in the test suite, which specifically simulate this exact attack and confirm it's blocked.

## 5. Input validation & injection

| Item | Status |
|---|---|
| Server-side validation of journal text, posts, messages, display names, custom habit entries; max lengths | **Done.** Max-length check constraints added in `0004_security_hardening.sql` for `profiles.display_name` (60), `custom_habit_categories.label` (80), `emergency_contacts.name/phone/relationship`, `sos_broadcasts.message` (500), and a size cap on `journal_entries.answers` (20KB serialized). `community_posts.text` and `sos_broadcast_replies.message` already had length checks from `0001`/`0002`. |
| Parameterized queries everywhere; no injection via NoSQL query operators | **Done.** Every database call in `src/api/*.ts` goes through the Supabase JS query builder (`.select()/.insert()/.update()/.eq()` etc.), which parameterizes all values — there is no raw string-built SQL anywhere in the client. |
| Escape user content on render; never render as HTML | **Done / N/A.** This is React Native — all user content renders through `<Text>` components, which never interpret markup. `grep` for `dangerouslySetInnerHTML` and `WebView` across `src/` returns nothing; there is no HTML-rendering surface in the app at all. |
| Strip EXIF/location metadata from uploads; validate file type/size server-side | **N/A.** There is no image/file upload feature anywhere in the app (`grep` for `ImagePicker`/`storage.from` returns nothing) — nothing to strip metadata from. |
| Server-side content policy mirroring the client filter (phone numbers, empty text) | **Done.** `src/utils/contentFilter.ts` is client-side UX only and can be bypassed by calling the API directly — `0004_security_hardening.sql` adds a `BEFORE INSERT/UPDATE` trigger (`enforce_post_content_policy`, `enforce_sos_reply_content_policy`) that independently rejects empty or phone-number-containing text on `community_posts` and `sos_broadcast_replies`, proven by the test suite. |

## 6. Data protection & privacy

| Item | Status |
|---|---|
| TLS everywhere; no cleartext | **Done.** Supabase is HTTPS-only by default; there is no cleartext exception configured anywhere in `app.json` (no `NSAppTransportSecurity`/`usesCleartextTraffic` override — checked, none present), so both platforms use their secure defaults. |
| Encrypt sensitive data at rest; platform keychain/keystore for locally cached sensitive data, never plain SharedPreferences/UserDefaults | **Done.** The Supabase session (access + refresh tokens) was previously stored in plain `AsyncStorage`, which is unencrypted on both iOS (a plist) and Android — exactly the pattern this item warns against. Fixed: `src/api/secureSessionStorage.ts` now backs session storage with `expo-secure-store` (iOS Keychain / Android Keystore) on native, chunked to work around SecureStore's per-value size limit; web keeps `AsyncStorage` (browser `localStorage`) since there's no keychain equivalent reachable from JS there — see `src/api/supabase.ts`. Database-level encryption at rest is handled by Supabase's managed Postgres infrastructure. |
| Data minimization; no precise geolocation for "local" community | **Done.** The app never requests device geolocation — `region` is a user-selected text value (`RegionPickerScreen`), not GPS coordinates. |
| Journal entries private by default; sharing is explicit per-entry | **Done.** `journal_entries.is_shared` defaults to `false`; `DocumentationLevelScreen.tsx`'s share checkbox is unchecked by default and is the only way a given entry's text reaches `community_posts`. |
| Full account deletion (auth + all data) | **Done.** `supabase/functions/delete-account` calls `admin.deleteUser`, which cascades to every user-owned table via `on delete cascade` foreign keys defined across `0001`-`0004`. |
| Data export (GDPR/CCPA) | **Not implemented.** No in-app "download my data" feature exists yet. Recommend a small Edge Function that reads all of a user's rows across `profiles`/`journal_entries`/`level_progress`/`gamification_state`/`emergency_contacts`/`community_posts` and returns them as JSON — out of scope for this pass, flagged for follow-up. |
| No PII in logs / crash reports / analytics | **Done.** `grep` for `console.log` mentioning journal/contact/password/token/phone content across `src/` returns nothing. The app has no analytics or crash-reporting SDK integrated at all currently, so there's no third-party sink to leak into. |

## 7. Community & abuse safety

| Item | Status |
|---|---|
| Report button + full-hiding block function | **Done.** `reportContent()`/`blockUser()` in `src/api/community.ts`; blocking is enforced at the RLS layer both directions (`posts_select_visible`, `sos_select_same_region` both exclude blocked authors), not just hidden in the UI. |
| Content filter + moderation queue | **Partial.** Client-side filter (`contentFilter.ts`) now backed by a server-side trigger (§5). The `reports` table is the moderation queue; auto-hide triggers at 3 *distinct* reporters (a duplicate-report unique constraint was added in `0004` so one user can no longer inflate the count alone — see §3). There's no moderation *dashboard* UI — reviewing the `reports` table currently requires the Supabase dashboard directly. Human review cadence is a process commitment, not code — see **B8**. |
| Rate-limit posting and messaging | **Done.** `0004_security_hardening.sql` adds `BEFORE INSERT` triggers capping `community_posts` to 10/5min, `sos_broadcasts` to 5/hour, `sos_broadcast_replies` to 20/10min, and `reports` to 30/hour, all per-user — proven in the test suite. |
| SOS broadcasts don't expose precise location/contact info | **Done.** `sos_broadcasts` only ever stores a user-selected `region` string and display name — never GPS coordinates or contact details. |
| New/unverified accounts can't mass-DM | **N/A.** No DM feature exists (see §3) — SOS replies are rate-limited the same as any other user's (§ above), with no separate "new account" tier since there's no messaging feature to abuse beyond that. |

## 8. API & infrastructure

| Item | Status |
|---|---|
| Rate limiting on all endpoints | **Done** for the write paths that matter (posts, SOS broadcasts/replies, reports, level completions — see §4/§7). Read endpoints go through Supabase's PostgREST layer, which has its own connection/request limits at the infrastructure level. |
| App Check / attestation | **Not implemented — console step.** See **B5**. |
| CORS allowlists | **N/A.** No custom HTTP endpoints exist outside Supabase's own API (PostgREST + Edge Functions), which Supabase manages CORS for at the project level. |
| Security headers (CSP, HSTS, etc.) on any web surface | **Partial.** The Netlify-hosted web build (`netlify.toml`) doesn't currently set custom security headers. Recommend adding a `[[headers]]` block for `X-Content-Type-Options`, `X-Frame-Options`, and a CSP once the web build's asset origins are finalized — out of scope for this pass since it's a static Expo export with no separate backend surface to protect beyond what Supabase already terminates TLS for. |
| Dependency vulnerability audit | **Checked.** `npm audit` was run during this pass; no criticals were introduced by this change set. Recommend running it on a recurring basis (see §C in the original checklist). |
| Verbose errors off in production | **Partial.** Edge Functions currently return `String(err)` on failure (`delete-account`, `complete-level`), which could leak internal detail in rare error paths. Low risk (these are two narrowly-scoped functions with no sensitive internals to leak, and errors are logged server-side via `console.error` regardless), but worth trimming to a generic message before a wider function surface is built. |

## 9. Mobile app hardening

| Item | Status |
|---|---|
| Obfuscation/minification, R8/ProGuard, symbol stripping | **Default-on.** EAS Build's release profile enables Android R8/ProGuard and JS minification by default for managed Expo apps — nothing in this repo's config disables them. Verify the `eas.json` production profile if one is added. |
| `android:debuggable=false`, `android:allowBackup=false` | **Done** for `allowBackup` — explicitly set `"allowBackup": false` in `app.json`'s `android` block (was unset, defaulting to `true`). `debuggable` is controlled by the build profile (EAS release builds set it to `false` automatically; there is no `eas.json` in this repo yet to pin it in — recommend adding one before a release build). |
| Deep links / URL schemes validate params; no open redirect | **N/A / low risk.** No custom `linking` config or deep-link param parsing exists in the app (`grep` for `Linking`/`linking` in `src/navigation` and `App.tsx` returns nothing) — the declared `scheme: "maxx"` is used only as the OAuth redirect target for `expo-auth-session`/Apple sign-in, whose flows are validated by the underlying PKCE/state mechanism, not custom app code. |
| WebViews locked down | **N/A.** No WebView is used anywhere in the app. |

## 10. Deliverable

This file. See "How to verify this yourself" above for the automated proof, and the list below for what's flagged for a human.

---

## Flagged for the human (cannot be done by an AI agent in this session)

These require your accounts, your money, or your own judgment call — see the
original checklist's Section B for full context on each:

- **Rotate/verify secrets** — none were found leaked, but re-confirm your live Supabase anon key + service-role key are the ones currently in your `.env`/EAS secrets, not older ones from before this project existed.
- **2FA on your own accounts** (GitHub, Apple Developer, Google Play Console, Supabase, domain registrar, email) — the actual weakest link in most small-app breaches.
- **Repo visibility + GitHub secret scanning/Dependabot** — decide if this repo should be private; enable both in repo settings.
- **Deploy this migration and verify in the Supabase dashboard** that `0004_security_hardening.sql` actually ran, and that no table shows an "allow all" policy in the dashboard's RLS view.
- **Enable App Check / attestation** in the Supabase console (§8, B5).
- **Billing alerts + quota limits** in the Supabase/hosting console.
- **SPF/DKIM/DMARC** on your domain if/when you send email (password resets, once that flow exists).
- **Moderation duty** — decide who checks the `reports` table and how often (Apple expects action within ~24h for UGC reports).
- **Legal review** — this app stores addiction-related journal data from what may include minors; have an attorney review the Privacy Policy, Terms, retention plan, and COPPA exposure if under-13 users are possible.
- **Pre-launch pentest** — at minimum, manually try to read one test account's journal/contacts from a second account via the app and via direct API calls (Proxyman/Charles) before shipping. A paid professional pentest is the strongest single purchase available here.
- **App Store privacy labels / Play Console data-safety form** — must be filled by you and must match what the app actually collects.
- **Incident response plan** — write down, in advance, how you'd rotate keys, force-logout users, and notify them if there's ever a breach.
- **Confirm Supabase Auth console settings**: "Confirm email" enabled, refresh token rotation enabled, leaked-password protection enabled, CAPTCHA on auth forms.
