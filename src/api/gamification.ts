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

export async function getGamificationState(userId: string): Promise<GamificationState> {
  const { data, error } = await supabase.from('gamification_state').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (data) return fromRow(data as StateRow);

  // First-time read: create the default row.
  const { data: created, error: insertError } = await supabase
    .from('gamification_state')
    .insert({ user_id: userId })
    .select()
    .single();
  if (insertError) throw insertError;
  return fromRow(created as StateRow);
}

export async function saveGamificationState(state: GamificationState) {
  const { error } = await supabase
    .from('gamification_state')
    .update({
      xp: state.xp,
      credits: state.credits,
      current_streak: state.currentStreak,
      longest_streak: state.longestStreak,
      last_active_date: state.lastActiveDate,
      streak_freezes_available: state.streakFreezesAvailable,
      streak_freezes_used_total: state.streakFreezesUsedTotal,
    })
    .eq('user_id', state.userId);
  if (error) throw error;
}
