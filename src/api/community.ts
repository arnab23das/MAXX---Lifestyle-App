import { supabase } from './supabase';
import { CommunityPost, Report, Block } from '@/types/domain';

interface PostRow {
  id: string;
  author_id: string;
  author_display_name: string;
  created_at: string;
  region: string | null;
  source_journal_entry_id: string | null;
  text: string;
  report_count: number;
}

function fromRow(row: PostRow, affirmationCount: number): CommunityPost {
  return {
    id: row.id,
    authorId: row.author_id,
    authorDisplayName: row.author_display_name,
    createdAt: row.created_at,
    region: row.region,
    sourceJournalEntryId: row.source_journal_entry_id,
    text: row.text,
    affirmationCount,
  };
}

async function attachAffirmationCounts(rows: PostRow[]): Promise<CommunityPost[]> {
  if (rows.length === 0) return [];
  const { data: reactions, error } = await supabase
    .from('reactions')
    .select('post_id')
    .in('post_id', rows.map((r) => r.id));
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const r of reactions ?? []) {
    counts.set(r.post_id, (counts.get(r.post_id) ?? 0) + 1);
  }
  return rows.map((row) => fromRow(row, counts.get(row.id) ?? 0));
}

/** Global feed: every visible post, newest first. */
export async function getGlobalFeed(limit = 50): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return attachAffirmationCounts(data as PostRow[]);
}

/** Local feed: posts from the same user-selected region (spec §6 decision). */
export async function getLocalFeed(region: string, limit = 50): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .eq('region', region)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return attachAffirmationCounts(data as PostRow[]);
}

export async function createPost(params: {
  authorId: string;
  authorDisplayName: string;
  region: string | null;
  text: string;
  sourceJournalEntryId?: string | null;
}): Promise<CommunityPost> {
  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      author_id: params.authorId,
      author_display_name: params.authorDisplayName,
      region: params.region,
      text: params.text,
      source_journal_entry_id: params.sourceJournalEntryId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data as PostRow, 0);
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from('community_posts').delete().eq('id', postId);
  if (error) throw error;
}

export async function sendAffirmation(postId: string, userId: string) {
  const { error } = await supabase.from('reactions').insert({ post_id: postId, user_id: userId, kind: 'affirmation' });
  // Unique constraint violation just means "already sent" — treat as a no-op.
  if (error && !error.message.includes('duplicate')) throw error;
}

export async function reportContent(params: {
  reporterId: string;
  targetType: Report['targetType'];
  targetId: string;
  reason: string;
  details?: string;
}) {
  const { error } = await supabase.from('reports').insert({
    reporter_id: params.reporterId,
    target_type: params.targetType,
    target_id: params.targetId,
    reason: params.reason,
    details: params.details ?? null,
  });
  if (error) throw error;
}

export async function blockUser(blockerId: string, blockedId: string): Promise<Block> {
  const { data, error } = await supabase
    .from('blocks')
    .insert({ blocker_id: blockerId, blocked_id: blockedId })
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, blockerId: data.blocker_id, blockedId: data.blocked_id, createdAt: data.created_at };
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase.from('blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId);
  if (error) throw error;
}

export async function getMyBlocks(blockerId: string): Promise<Block[]> {
  const { data, error } = await supabase.from('blocks').select('*').eq('blocker_id', blockerId);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    blockerId: row.blocker_id,
    blockedId: row.blocked_id,
    createdAt: row.created_at,
  }));
}
