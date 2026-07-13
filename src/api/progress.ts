import { supabase } from './supabase';
import { LevelProgress } from '@/types/domain';

interface ProgressRow {
  user_id: string;
  level_id: string;
  status: LevelProgress['status'];
  completed_at: string | null;
  attempts: number;
}

function fromRow(row: ProgressRow): LevelProgress {
  return {
    userId: row.user_id,
    levelId: row.level_id,
    status: row.status,
    completedAt: row.completed_at,
    attempts: row.attempts,
  };
}

// level_progress is read-only for clients (see migration
// 0004_security_hardening.sql) — writes happen exclusively inside the
// complete-level Edge Function, using the service-role key, so a modified
// client can't mark levels complete (or reset them back to 'unlocked' to
// re-farm XP) by writing this table directly.
export async function getProgressForUser(userId: string): Promise<LevelProgress[]> {
  const { data, error } = await supabase.from('level_progress').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data as ProgressRow[]).map(fromRow);
}
