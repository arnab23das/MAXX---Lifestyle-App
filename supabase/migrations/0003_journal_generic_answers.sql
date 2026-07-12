-- Documentation levels now use a dynamic, per-level set of fields (spec:
-- "MAXX — Level Design & Generation Prompt", §2 documentation.fields) rather
-- than the fixed mood/craving/wins/free_text columns from 0001_init.sql.
-- Add a generic answers column keyed by each field's `key`; the old columns
-- stay for backward compatibility with any existing rows but are no longer
-- written by the client.

alter table public.journal_entries add column answers jsonb not null default '{}'::jsonb;
