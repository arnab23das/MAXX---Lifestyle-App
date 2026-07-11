-- MAXX initial schema.
-- Modular Track -> Path -> Level content lives in the app bundle (src/content),
-- not in the database — only per-user selections and progress are persisted here,
-- so tracks 2 and 3 ship later as app-side data with no schema change required.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text not null default 'MAXX user',
  selected_track_id text,
  selected_category_ids jsonb not null default '[]'::jsonb,
  region text,
  accepted_terms_at timestamptz,
  accepted_terms_version text,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- custom habit categories (free-text "Other" entries, spec §3.3)
-- ---------------------------------------------------------------------------
create table public.custom_habit_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);

alter table public.custom_habit_categories enable row level security;

create policy "custom_categories_owner_all" on public.custom_habit_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- level progress
-- ---------------------------------------------------------------------------
create table public.level_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  level_id text not null,
  status text not null default 'locked' check (status in ('locked', 'unlocked', 'completed')),
  completed_at timestamptz,
  attempts integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, level_id)
);

alter table public.level_progress enable row level security;

create policy "level_progress_owner_all" on public.level_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- gamification state (xp, credits, streaks)
-- ---------------------------------------------------------------------------
create table public.gamification_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  xp integer not null default 0,
  credits integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  streak_freezes_available integer not null default 1,
  streak_freezes_used_total integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.gamification_state enable row level security;

create policy "gamification_owner_all" on public.gamification_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- journal entries (documentation levels)
-- ---------------------------------------------------------------------------
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  level_id text,
  created_at timestamptz not null default now(),
  mood smallint check (mood between 1 and 5),
  craving smallint check (craving between 1 and 5),
  wins jsonb not null default '[]'::jsonb,
  free_text text not null default '',
  is_shared boolean not null default false
);

alter table public.journal_entries enable row level security;

create policy "journal_owner_all" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- blocks (created before community_posts: its RLS policy below references
-- public.blocks in a subquery, and Postgres runs this whole file as one
-- transaction — a forward reference here would abort everything)
-- ---------------------------------------------------------------------------
create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

alter table public.blocks enable row level security;

create policy "blocks_owner_all" on public.blocks
  for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- ---------------------------------------------------------------------------
-- community: posts, reactions, reports
-- ---------------------------------------------------------------------------
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_display_name text not null,
  created_at timestamptz not null default now(),
  region text,
  source_journal_entry_id uuid references public.journal_entries (id) on delete set null,
  text text not null check (char_length(text) between 1 and 1000),
  report_count integer not null default 0,
  is_hidden boolean not null default false
);

alter table public.community_posts enable row level security;

-- Readable by any authenticated user, except posts hidden by moderation or
-- authored by someone the reader has blocked.
create policy "posts_select_visible" on public.community_posts
  for select using (
    auth.role() = 'authenticated'
    and is_hidden = false
    and not exists (
      select 1 from public.blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = author_id
    )
  );

create policy "posts_insert_own" on public.community_posts
  for insert with check (auth.uid() = author_id);
create policy "posts_delete_own" on public.community_posts
  for delete using (auth.uid() = author_id);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'affirmation' check (kind = 'affirmation'),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, kind)
);

alter table public.reactions enable row level security;

create policy "reactions_select_all" on public.reactions
  for select using (auth.role() = 'authenticated');
create policy "reactions_insert_own" on public.reactions
  for insert with check (auth.uid() = user_id);
create policy "reactions_delete_own" on public.reactions
  for delete using (auth.uid() = user_id);

-- Required for App Store UGC review (spec §6): reporting objectionable content.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'user', 'sos_broadcast')),
  target_id uuid not null,
  reason text not null,
  details text,
  created_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed'))
);

alter table public.reports enable row level security;

create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = reporter_id);
create policy "reports_select_own" on public.reports
  for select using (auth.uid() = reporter_id);

-- Auto-hide a post once it accumulates enough reports, pending human review.
create function public.handle_new_report()
returns trigger as $$
begin
  if new.target_type = 'post' then
    update public.community_posts
      set report_count = report_count + 1,
          is_hidden = (report_count + 1) >= 3
      where id = new.target_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_report_created
  after insert on public.reports
  for each row execute procedure public.handle_new_report();

-- ---------------------------------------------------------------------------
-- SOS: emergency contacts + local broadcasts
-- ---------------------------------------------------------------------------
create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  phone text not null,
  relationship text
);

alter table public.emergency_contacts enable row level security;

create policy "contacts_owner_all" on public.emergency_contacts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.sos_broadcasts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  region text,
  created_at timestamptz not null default now(),
  message text,
  active boolean not null default true
);

alter table public.sos_broadcasts enable row level security;

create policy "sos_select_same_region" on public.sos_broadcasts
  for select using (
    auth.role() = 'authenticated'
    and active = true
    and not exists (
      select 1 from public.blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = user_id
    )
  );
create policy "sos_insert_own" on public.sos_broadcasts
  for insert with check (auth.uid() = user_id);
create policy "sos_update_own" on public.sos_broadcasts
  for update using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Account deletion (Apple requires in-app deletion when accounts can be created)
-- ---------------------------------------------------------------------------
-- Deleting the auth.users row cascades to every table above via FK "on delete
-- cascade", so account deletion is a single admin-privileged call
-- (see src/api/account.ts) from the client using a Supabase Edge Function or
-- the service role — never delete auth.users directly from the client.
