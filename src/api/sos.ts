import { supabase } from './supabase';
import { EmergencyContact, SosBroadcast } from '@/types/domain';

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

/** Broadcasts an "I need support" ping to the user's local community (spec §7.4). */
export async function createSosBroadcast(userId: string, region: string | null, message: string | null): Promise<SosBroadcast> {
  const { data, error } = await supabase
    .from('sos_broadcasts')
    .insert({ user_id: userId, region, message, active: true })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    userId: data.user_id,
    region: data.region,
    createdAt: data.created_at,
    message: data.message,
    active: data.active,
  };
}

export async function deactivateSosBroadcast(id: string) {
  const { error } = await supabase.from('sos_broadcasts').update({ active: false }).eq('id', id);
  if (error) throw error;
}

export async function getActiveLocalBroadcasts(region: string): Promise<SosBroadcast[]> {
  const { data, error } = await supabase
    .from('sos_broadcasts')
    .select('*')
    .eq('region', region)
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    region: row.region,
    createdAt: row.created_at,
    message: row.message,
    active: row.active,
  }));
}
