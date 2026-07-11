import { supabase } from './supabase';
import { EmergencyContact, SosBroadcast, SosBroadcastReply } from '@/types/domain';

export async function getMyEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
  const { data, error } = await supabase.from('emergency_contacts').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    relationship: row.relationship,
  }));
}

export async function addEmergencyContact(userId: string, name: string, phone: string, relationship?: string) {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert({ user_id: userId, name, phone, relationship: relationship ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeEmergencyContact(id: string) {
  const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
  if (error) throw error;
}

function fromBroadcastRow(row: any): SosBroadcast {
  return {
    id: row.id,
    userId: row.user_id,
    region: row.region,
    createdAt: row.created_at,
    message: row.message,
    active: row.active,
  };
}

/** Broadcasts an "I need support" ping to the user's local community (spec §7.4). */
export async function createSosBroadcast(
  userId: string,
  authorDisplayName: string,
  region: string | null,
  message: string | null
): Promise<SosBroadcast> {
  const { data, error } = await supabase
    .from('sos_broadcasts')
    .insert({ user_id: userId, author_display_name: authorDisplayName, region, message, active: true })
    .select()
    .single();
  if (error) throw error;
  return fromBroadcastRow(data);
}

export async function deactivateSosBroadcast(id: string) {
  const { error } = await supabase.from('sos_broadcasts').update({ active: false }).eq('id', id);
  if (error) throw error;
}

/** Active broadcasts from the local community, excluding the current user's own. */
export async function getOtherActiveLocalBroadcasts(region: string, excludeUserId: string): Promise<(SosBroadcast & { authorDisplayName: string })[]> {
  const { data, error } = await supabase
    .from('sos_broadcasts')
    .select('*')
    .eq('region', region)
    .eq('active', true)
    .neq('user_id', excludeUserId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({ ...fromBroadcastRow(row), authorDisplayName: row.author_display_name }));
}

export async function sendBroadcastReply(
  broadcastId: string,
  authorId: string,
  authorDisplayName: string,
  message: string
): Promise<SosBroadcastReply> {
  const { data, error } = await supabase
    .from('sos_broadcast_replies')
    .insert({ broadcast_id: broadcastId, author_id: authorId, author_display_name: authorDisplayName, message })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    broadcastId: data.broadcast_id,
    authorId: data.author_id,
    authorDisplayName: data.author_display_name,
    message: data.message,
    createdAt: data.created_at,
  };
}

export async function getRepliesForBroadcast(broadcastId: string): Promise<SosBroadcastReply[]> {
  const { data, error } = await supabase
    .from('sos_broadcast_replies')
    .select('*')
    .eq('broadcast_id', broadcastId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    broadcastId: row.broadcast_id,
    authorId: row.author_id,
    authorDisplayName: row.author_display_name,
    message: row.message,
    createdAt: row.created_at,
  }));
}
