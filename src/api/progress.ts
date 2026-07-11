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

export async function getProgressForUser(userId: string): Promise<LevelProgress[]> {
  const { data, error } = await supabase.from('level_progress').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data as ProgressRow[]).map(fromRow);
}

export async function upsertProgress(
  userId: string,
  levelId: string,
  patch: Partial<Pick<LevelProgress, 'status' | 'completedAt' | 'attempts'>>
) {
  const { error } = await supabase.from('level_progress').upsert(
    {
      user_id: userId,
      level_id: levelId,
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.completedAt !== undefined ? { completed_at: patch.completedAt } : {}),
      ...(patch.attempts !== undefined ? { attempts: patch.attempts } : {}),
    },
    { onConflict: 'user_id,level_id' }
  );
  if (error) throw error;
}
