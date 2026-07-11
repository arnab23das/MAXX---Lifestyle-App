import { supabase } from './supabase';

/**
 * Permanently deletes the signed-in user's account and all associated data.
 * Calls the `delete-account` Edge Function (supabase/functions/delete-account),
 * which runs with the service role to delete the auth.users row — every
 * other table cascades via `on delete cascade` (see migration 0001_init.sql).
 * Required by Apple: any app offering account creation must offer in-app
 * account deletion (spec §10).
 */
export async function deleteMyAccount() {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw error;
  await supabase.auth.signOut();
}
