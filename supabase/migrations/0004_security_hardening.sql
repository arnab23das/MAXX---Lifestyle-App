-- Security hardening pass (see SECURITY.md for the full checklist this maps to).
--
-- Fixes four concrete gaps found by auditing 0001-0003 against the app's own
-- threat model (client can intercept/replay traffic; RLS is the only real
-- boundary since there is no separate API server):
--
--   1. gamification_state was writable directly by the client (`for all`),
--      so any user could set their own xp/credits/streak to anything by
--      editing an outgoing request. It is now read-only for clients; all
--      writes go through the `complete-level` Edge Function (service role).
--   2. sos_select_same_region did not actually filter by region, so every
--      authenticated user could read every active SOS broadcast globally.
--   3. report_count only ever incremented, drifting out of sync with the
--      real number of open reports once any report is deleted/dismissed.
--   4. Nothing stopped a single user from posting/reporting/broadcasting in
--      an unbounded loop (RLS controls *who*, never *how often*).
--
-- Also adds: a duplicate-report guard, server-side content checks mirroring
-- src/utils/contentFilter.ts (defense in depth — the client-side filter can
-- always be bypassed by calling the API directly), and max-length bounds on
-- free-text columns that had none.
--
-- level_progress is locked down alongside gamification_state: the
-- complete-level Edge Function's duplicate-completion guard reads
-- level_progress.status, so if clients could still write that column
-- directly, a user could reset their own row back to 'unlocked' after a
-- real completion and re-invoke complete-level to farm XP indefinitely
-- (bounded only by the per-minute rate limit, which still adds up over a
-- day). Both tables' writes now happen exclusively in that one function.

-- ---------------------------------------------------------------------------
-- 1. gamification_state and level_progress: lock down to read-only for
--    clients — see rationale above
-- ---------------------------------------------------------------------------
drop policy if exists "gamification_owner_all" on public.gamification_state;

create policy "gamification_owner_select" on public.gamification_state
  for select using (auth.uid() = user_id);

drop policy if exists "level_progress_owner_all" on public.level_progress;

create policy "level_progress_owner_select" on public.level_progress
  for select using (auth.uid() = user_id);

-- No insert/update/delete policy is created for the `authenticated` role on
-- either table: RLS defaults to deny, so clients now have zero write access
-- to gamification_state or level_progress. Row creation for
-- gamification_state moves into handle_new_user() (below) so every user
-- still gets a default row automatically; level_progress rows are created
-- lazily by complete-level on first completion. All writes to both tables
-- happen in that one Edge Function, using the service-role key.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  insert into public.gamification_state (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------------
-- 2. sos_broadcasts: actually filter by region, keep the owner able to see
--    their own broadcast regardless (e.g. before their profile.region is set)
-- ---------------------------------------------------------------------------
drop policy if exists "sos_select_same_region" on public.sos_broadcasts;

create policy "sos_select_same_region" on public.sos_broadcasts
  for select using (
    auth.role() = 'authenticated'
    and (
      auth.uid() = user_id
      or (
        active = true
        and (
          region is null
          or region = (select p.region from public.profiles p where p.id = auth.uid())
        )
        and not exists (
          select 1 from public.blocks b
          where b.blocker_id = auth.uid() and b.blocked_id = user_id
        )
      )
    )
  );

-- sos_broadcast_replies (0002) has no region filter of its own by design: its
-- select policy re-queries public.sos_broadcasts, which now enforces RLS
-- (including the region filter above) on that inner read too, so the fix
-- above closes the same gap for replies transitively — no change needed
-- there.

-- ---------------------------------------------------------------------------
-- 3. reports: keep report_count in sync when a report is deleted/dismissed,
--    and stop one user from inflating the count by reporting the same
--    target repeatedly
-- ---------------------------------------------------------------------------
alter table public.reports
  add constraint reports_one_per_reporter_per_target unique (reporter_id, target_type, target_id);

create or replace function public.handle_deleted_report()
returns trigger as $$
begin
  if old.target_type = 'post' then
    update public.community_posts
      set report_count = greatest(report_count - 1, 0)
      where id = old.target_id;
  end if;
  return old;
end;
$$ language plpgsql security definer;

create trigger on_report_deleted
  after delete on public.reports
  for each row execute procedure public.handle_deleted_report();

-- ---------------------------------------------------------------------------
-- 4. Rate limiting at the database layer (there is no separate API server to
--    put a rate limiter in front of — Postgres is the only chokepoint every
--    write passes through, so the limits live here as BEFORE INSERT triggers)
-- ---------------------------------------------------------------------------
create or replace function public.enforce_post_rate_limit()
returns trigger as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
    from public.community_posts
    where author_id = new.author_id
      and created_at > now() - interval '5 minutes';
  if recent_count >= 10 then
    raise exception 'Rate limit exceeded: too many posts in a short time. Please wait a few minutes.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger enforce_post_rate_limit_trigger
  before insert on public.community_posts
  for each row execute procedure public.enforce_post_rate_limit();

create or replace function public.enforce_sos_broadcast_rate_limit()
returns trigger as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
    from public.sos_broadcasts
    where user_id = new.user_id
      and created_at > now() - interval '1 hour';
  if recent_count >= 5 then
    raise exception 'Rate limit exceeded: please wait before sending another SOS broadcast.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger enforce_sos_broadcast_rate_limit_trigger
  before insert on public.sos_broadcasts
  for each row execute procedure public.enforce_sos_broadcast_rate_limit();

create or replace function public.enforce_sos_reply_rate_limit()
returns trigger as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
    from public.sos_broadcast_replies
    where author_id = new.author_id
      and created_at > now() - interval '10 minutes';
  if recent_count >= 20 then
    raise exception 'Rate limit exceeded: too many replies in a short time. Please wait a few minutes.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger enforce_sos_reply_rate_limit_trigger
  before insert on public.sos_broadcast_replies
  for each row execute procedure public.enforce_sos_reply_rate_limit();

create or replace function public.enforce_report_rate_limit()
returns trigger as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
    from public.reports
    where reporter_id = new.reporter_id
      and created_at > now() - interval '1 hour';
  if recent_count >= 30 then
    raise exception 'Rate limit exceeded: too many reports in a short time.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger enforce_report_rate_limit_trigger
  before insert on public.reports
  for each row execute procedure public.enforce_report_rate_limit();

-- ---------------------------------------------------------------------------
-- 5. Server-side content policy for public/shared text (mirrors
--    src/utils/contentFilter.ts — the client check is UX only and can be
--    bypassed by calling the API directly, so it must also be enforced here)
-- ---------------------------------------------------------------------------
create or replace function public.enforce_text_content_policy(input_text text)
returns void as $$
begin
  if trim(input_text) = '' then
    raise exception 'Content cannot be empty.';
  end if;
  if input_text ~ '\d{3}[-. ]?\d{3}[-. ]?\d{4}' then
    raise exception 'For your safety, phone numbers can''t be posted publicly.';
  end if;
end;
$$ language plpgsql immutable;

create or replace function public.enforce_post_content_policy()
returns trigger as $$
begin
  perform public.enforce_text_content_policy(new.text);
  return new;
end;
$$ language plpgsql;

create trigger enforce_post_content_policy_trigger
  before insert or update on public.community_posts
  for each row execute procedure public.enforce_post_content_policy();

create or replace function public.enforce_sos_reply_content_policy()
returns trigger as $$
begin
  perform public.enforce_text_content_policy(new.message);
  return new;
end;
$$ language plpgsql;

create trigger enforce_sos_reply_content_policy_trigger
  before insert or update on public.sos_broadcast_replies
  for each row execute procedure public.enforce_sos_reply_content_policy();

-- ---------------------------------------------------------------------------
-- 6. Max-length bounds on free-text columns that had none (defense against
--    abuse and accidental multi-KB payloads — community_posts.text and
--    sos_broadcast_replies.message already had check constraints from
--    0001/0002)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add constraint profiles_display_name_length check (char_length(display_name) between 1 and 60);

alter table public.custom_habit_categories
  add constraint custom_categories_label_length check (char_length(label) between 1 and 80);

alter table public.emergency_contacts
  add constraint contacts_name_length check (char_length(name) between 1 and 100),
  add constraint contacts_phone_length check (char_length(phone) between 3 and 30),
  add constraint contacts_relationship_length check (relationship is null or char_length(relationship) <= 50);

alter table public.sos_broadcasts
  add constraint sos_message_length check (message is null or char_length(message) <= 500);

-- journal_entries.answers (0003) is an unbounded jsonb blob — Documentation
-- levels only ever have a handful of short fields, so cap the serialized
-- size well above any legitimate entry to block oversized payloads sent
-- directly to the API.
alter table public.journal_entries
  add constraint journal_answers_size check (pg_column_size(answers) <= 20000);
