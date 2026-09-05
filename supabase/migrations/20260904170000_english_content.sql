-- ---------------------------------------------------------------------------
-- English content alongside the Bulgarian.
--
-- Names and descriptions only. All nullable: the app falls back to the
-- Bulgarian text when the English one is missing, so the site is never half
-- empty while the translations are being filled in.
--
-- The existing policies are per-table, not per-column, so these need no new
-- grants. menu_items.category still stores the Bulgarian category name — it is
-- the value the menu filter compares against — and the rename trigger from
-- 20260904150000 keys on menu_categories.name, so editing name_en never
-- touches menu_items.
-- ---------------------------------------------------------------------------

alter table public.menu_items
  add column if not exists name_en        text,
  add column if not exists description_en text;

alter table public.projects
  add column if not exists title_en       text,
  add column if not exists description_en text;

alter table public.menu_categories
  add column if not exists name_en text;
