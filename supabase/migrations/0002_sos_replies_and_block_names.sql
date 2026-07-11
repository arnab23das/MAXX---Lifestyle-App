-- Follow-up migration: fills two gaps left after the initial build.
--
-- 1. `blocks` had no human-readable name for the blocked user, so the
--    Blocked Users settings screen could only show a raw UUID (profiles
--    aren't cross-readable under RLS — see profiles_select_own in
--    0001_init.sql). We denormalize the display name at block-time, the same
--    pattern already used by community_posts.author_display_name.
--
-- 2. `sos_broadcasts` had no way for a nearby community member to actually
--    respond (spec §7.4: "who can respond with affirmations or personal help
--    via message"). This adds a lightweight reply table scoped to one
--    broadcast at a time — not a general DM inbox.

alter table public.blocks add column blocked_display_name text not null default 'MAXX user';

-- sos_broadcasts had the same gap as blocks: no readable name for the
-- broadcaster, needed to show "X needs support" in the nearby-broadcasts list.
alter table public.sos_broadcasts add column author_display_name text not null default 'MAXX user';

create table public.sos_broadcast_replies (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null references public.sos_broadcasts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_display_name text not null,
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.sos_broadcast_replies enable row level security;

-- Anyone who can see the broadcast (same region, active, not blocked — see
-- sos_select_same_region in 0001_init.sql) can reply to it.
create policy "sos_replies_select" on public.sos_broadcast_replies
  for select using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.sos_broadcasts b
      where b.id = broadcast_id
        and not exists (
          select 1 from public.blocks bl
          where bl.blocker_id = auth.uid() and bl.blocked_id = b.user_id
        )
    )
  );

create policy "sos_replies_insert" on public.sos_broadcast_replies
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.sos_broadcasts b
      where b.id = broadcast_id and b.active = true
    )
  );
