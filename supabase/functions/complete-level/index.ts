// Supabase Edge Function: the only place XP, credits, and streaks are ever
// written. Deploy with: supabase functions deploy complete-level
//
// Why this exists: gamification_state used to be directly writable by the
// client (`for all using (auth.uid() = user_id)`), which meant anyone who
// could intercept or replay their own app traffic could set their own xp,
// credits, or streak to any value. gamification_state is now read-only for
// clients (see migration 0004_security_hardening.sql) — the client reports
// "I finished level X", and this function decides, independently, what that
// is actually worth and writes the result using the service-role key.
//
// The level's reward is derived from the level id itself (see
// _shared/levelRewards.ts), not trusted from the request body, since level
// *content* lives client-side and this function has no other source of
// truth for "what type is this level" or "what does it pay out".

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { resolveLevelReward } from '../_shared/levelRewards.ts';
import { applyActiveDay, maybeAwardStreakFreeze, todayDateString, type GamificationLike } from '../_shared/gamification.ts';

// Generous ceiling on completions per user per minute — real usage (even a
// user blazing through short Documentation/Lesson levels) stays well under
// this; it exists only to stop scripted/automated farming.
const MAX_COMPLETIONS_PER_MINUTE = 20;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401);
    }

    let body: { levelId?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }
    const levelId = body.levelId;
    if (typeof levelId !== 'string' || levelId.length === 0) {
      return json({ error: 'levelId is required' }, 400);
    }

    const reward = resolveLevelReward(levelId);
    if (!reward) {
      return json({ error: 'Unknown level id' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Identify the caller from their own JWT before doing anything privileged.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: 'Invalid session' }, 401);
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Reject if this exact level was already completed — otherwise a user
    // could call this endpoint repeatedly for the same level and farm
    // unlimited XP/credits.
    const { data: existingProgress, error: progressReadError } = await admin
      .from('level_progress')
      .select('status, attempts')
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .maybeSingle();
    if (progressReadError) throw progressReadError;

    if (existingProgress?.status === 'completed') {
      const { data: currentState } = await admin.from('gamification_state').select('*').eq('user_id', userId).maybeSingle();
      return json({ xpGained: 0, creditsGained: 0, usedFreeze: false, alreadyCompleted: true, gamification: currentState });
    }

    // Rate limit: cap completions per user in a rolling 60s window.
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { count: recentCount, error: rateError } = await admin
      .from('level_progress')
      .select('level_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('updated_at', oneMinuteAgo);
    if (rateError) throw rateError;
    if ((recentCount ?? 0) >= MAX_COMPLETIONS_PER_MINUTE) {
      return json({ error: 'Rate limit exceeded. Please slow down.' }, 429);
    }

    const { error: upsertError } = await admin.from('level_progress').upsert(
      {
        user_id: userId,
        level_id: levelId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        attempts: (existingProgress?.attempts ?? 0) + 1,
        // `default now()` on this column only applies to brand-new rows, not
        // to an ON CONFLICT UPDATE — set it explicitly so the rate-limit
        // query above (WHERE updated_at > ...) sees this completion.
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,level_id' }
    );
    if (upsertError) throw upsertError;

    let { data: gamification, error: gamError } = await admin
      .from('gamification_state')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (gamError) throw gamError;
    if (!gamification) {
      // Should always exist (created by handle_new_user()); create
      // defensively rather than fail the whole request.
      const { data: created, error: createError } = await admin
        .from('gamification_state')
        .insert({ user_id: userId })
        .select()
        .single();
      if (createError) throw createError;
      gamification = created;
    }

    const state: GamificationLike = {
      xp: gamification.xp,
      credits: gamification.credits,
      currentStreak: gamification.current_streak,
      longestStreak: gamification.longest_streak,
      lastActiveDate: gamification.last_active_date,
      streakFreezesAvailable: gamification.streak_freezes_available,
      streakFreezesUsedTotal: gamification.streak_freezes_used_total,
    };

    const today = todayDateString();
    const streakResult = applyActiveDay(state, today);
    const streakFreezesAvailable = maybeAwardStreakFreeze(streakResult.currentStreak, streakResult.streakFreezesAvailable);

    const nextState = {
      xp: state.xp + reward.xp,
      credits: state.credits + reward.credits,
      current_streak: streakResult.currentStreak,
      longest_streak: streakResult.longestStreak,
      last_active_date: today,
      streak_freezes_available: streakFreezesAvailable,
      streak_freezes_used_total: streakResult.streakFreezesUsedTotal,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error: updateError } = await admin
      .from('gamification_state')
      .update(nextState)
      .eq('user_id', userId)
      .select()
      .single();
    if (updateError) throw updateError;

    return json({
      xpGained: reward.xp,
      creditsGained: reward.credits,
      usedFreeze: streakResult.usedFreeze,
      gamification: updated,
    });
  } catch (err) {
    console.error('complete-level error', err);
    return json({ error: String(err) }, 500);
  }
});
