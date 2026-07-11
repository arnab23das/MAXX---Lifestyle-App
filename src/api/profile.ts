import { supabase } from './supabase';
import { UserProfile } from '@/types/domain';
import { TrackId } from '@/types/content';

interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string;
  selected_track_id: string | null;
  selected_category_ids: string[];
  region: string | null;
  accepted_terms_at: string | null;
  accepted_terms_version: string | null;
  notifications_enabled: boolean;
  created_at: string;
}

function fromRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    selectedTrackId: (row.selected_track_id as TrackId) ?? null,
    selectedCategoryIds: row.selected_category_ids ?? [],
    region: row.region,
    acceptedTermsAt: row.accepted_terms_at,
    acceptedTermsVersion: row.accepted_terms_version,
    notificationsEnabled: row.notifications_enabled,
  };
}

export async function getMyProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as ProfileRow) : null;
}

export async function updateMyProfile(
  userId: string,
  patch: Partial<{
    displayName: string;
    selectedTrackId: TrackId;
    selectedCategoryIds: string[];
    region: string;
    acceptedTermsAt: string;
    acceptedTermsVersion: string;
    notificationsEnabled: boolean;
  }>
) {
  const row: Record<string, unknown> = {};
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.selectedTrackId !== undefined) row.selected_track_id = patch.selectedTrackId;
  if (patch.selectedCategoryIds !== undefined) row.selected_category_ids = patch.selectedCategoryIds;
  if (patch.region !== undefined) row.region = patch.region;
  if (patch.acceptedTermsAt !== undefined) row.accepted_terms_at = patch.acceptedTermsAt;
  if (patch.acceptedTermsVersion !== undefined) row.accepted_terms_version = patch.acceptedTermsVersion;
  if (patch.notificationsEnabled !== undefined) row.notifications_enabled = patch.notificationsEnabled;

  const { error } = await supabase.from('profiles').update(row).eq('id', userId);
  if (error) throw error;
}

export async function addCustomHabitCategory(userId: string, label: string) {
  const { data, error } = await supabase
    .from('custom_habit_categories')
    .insert({ user_id: userId, label })
    .select()
    .single();
  if (error) throw error;
  return data as { id: string; user_id: string; label: string; created_at: string };
}

export async function getCustomHabitCategories(userId: string) {
  const { data, error } = await supabase.from('custom_habit_categories').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as { id: string; user_id: string; label: string; created_at: string }[];
}
