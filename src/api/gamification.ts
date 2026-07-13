import { supabase } from './supabase';
import { GamificationState } from '@/types/domain';

interface StateRow {
  user_id: string;
  xp: number;
  credits: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  streak_freezes_available: number;
  streak_freezes_used_total: number;
}

function fromRow(row: StateRow): GamificationState {
  return {
    userId: row.user_id,
    xp: row.xp,
    credits: row.credits,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastActiveDate: row.last_active_date,
    streakFreezesAvailable: row.streak_freezes_available,
    streakFreezesUsedTotal: row.streak_freezes_used_total,
  };
}

// gamification_state is read-only for clients (see migration
// 0004_security_hardening.sql) — every user's row is auto-created by the
// handle_new_user() trigger on signup, so this should always find a row.
// There is deliberately no client-side write function for this table
// anymore: xp/credits/streaks are only ever written by the complete-level
// Edge Function (see completeLevelOnServer below), using the service-role
// key, so a modified client can no longer grant itself rewards.
export async function getGamificationState(userId: string): Promise<GamificationState> {
  const { data, error } = await supabase.from('gamification_state').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (data) return fromRow(data as StateRow);

  // Defensive fallback only — the trigger should have already created this
  // row. Returns an in-memory default without attempting to write it (RLS
  // no longer allows clients to insert into this table).
  return {
    userId,
    xp: 0,
    credits: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    streakFreezesAvailable: 1,
    streakFreezesUsedTotal: 0,
  };
}

export interface LevelCompletionResult {
  xpGained: number;
  creditsGained: number;
  usedFreeze: boolean;
  alreadyCompleted?: boolean;
  gamification: StateRow;
}

/**
 * Reports a level as finished to the `complete-level` Edge Function, which
 * independently derives the XP/credit reward from the level id and writes
 * the new gamification state server-side. This is the only way gamification
 * state changes for real (non-demo) users.
 */
export async function completeLevelOnServer(levelId: string): Promise<LevelCompletionResult> {
  const { data, error } = await supabase.functions.invoke('complete-level', {
    body: { levelId },
  });
  if (error) throw error;
  return data as LevelCompletionResult;
}
