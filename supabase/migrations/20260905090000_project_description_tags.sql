-- ===========================================================================
-- THE COLUMNS THE PROJECT EDITOR HAS ALWAYS WRITTEN
--
-- public.projects carried title/title_en/date/image and, oddly,
-- description_en — but never `description` or `tags`, both of which the admin
-- dialog collects and sends. Every save therefore failed with
-- "Could not find the 'description' column of 'projects' in the schema cache",
-- and the pictures picked for that event were already in the bucket by then.
--
-- ProjectModel (src/app/shared/models/project.model.ts) types them as
-- `description?: string` and `tags?: string[]`, and the landing page renders
-- both when present, so they are nullable rather than defaulted: an event
-- saved without them reads the same as one saved before this migration.
-- ===========================================================================

alter table public.projects
  add column if not exists description text,
  add column if not exists tags        text[];
