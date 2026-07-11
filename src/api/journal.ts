import { supabase } from './supabase';
import { JournalEntry } from '@/types/domain';

interface JournalRow {
  id: string;
  user_id: string;
  level_id: string | null;
  created_at: string;
  mood: number | null;
  craving: number | null;
  wins: string[];
  free_text: string;
  is_shared: boolean;
}

function fromRow(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    userId: row.user_id,
    levelId: row.level_id,
    createdAt: row.created_at,
    mood: row.mood,
    craving: row.craving,
    wins: row.wins ?? [],
    freeText: row.free_text,
    isShared: row.is_shared,
  };
}

export async function createJournalEntry(
  userId: string,
  entry: { levelId: string | null; mood: number | null; craving: number | null; wins: string[]; freeText: string; isShared: boolean }
): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: userId,
      level_id: entry.levelId,
      mood: entry.mood,
      craving: entry.craving,
      wins: entry.wins,
      free_text: entry.freeText,
      is_shared: entry.isShared,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data as JournalRow);
}

export async function getMyJournalEntries(userId: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as JournalRow[]).map(fromRow);
}
