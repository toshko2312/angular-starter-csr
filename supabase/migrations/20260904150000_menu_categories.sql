-- ---------------------------------------------------------------------------
-- Menu categories, and DB-generated menu item ids.
--
-- The admin dialog no longer asks for an identifier, so the database has to
-- mint one. Categories move out of the free-text column into their own table
-- so the dialog can offer a fixed list instead of a typo-prone input; the
-- column keeps holding the category *name* so nothing about the public menu
-- page changes.
-- ---------------------------------------------------------------------------

-- ------------------------------------------------------------- menu_items.id
-- Was a hand-entered text key ('m1', 'm2'...). Existing rows keep their ids.
alter table public.menu_items
  alter column id set default gen_random_uuid()::text;

-- ------------------------------------------------------------ menu_categories

create table if not exists public.menu_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null unique,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.menu_categories enable row level security;

-- Same shape as menu_items: the list is public, only an admin may change it.
drop policy if exists "menu_categories are publicly readable" on public.menu_categories;
create policy "menu_categories are publicly readable"
  on public.menu_categories for select
  to anon, authenticated
  using (true);

drop policy if exists "authenticated may write menu_categories" on public.menu_categories;
create policy "authenticated may write menu_categories"
  on public.menu_categories for all
  to authenticated
  using (true) with check (true);

-- Seed from what the menu already uses, keeping the order the items appear in.
insert into public.menu_categories (name, sort_order)
select category, min(sort_order)
from public.menu_items
where coalesce(category, '') <> ''
group by category
on conflict (name) do nothing;

-- --------------------------------------------------------------- rename sync
-- menu_items.category stores the name, so a rename has to carry its items with
-- it or they are orphaned. Done in a trigger rather than in the client so the
-- two writes cannot come apart. Not SECURITY DEFINER: the trigger runs as the
-- signed-in admin, who already holds write access to menu_items through RLS.

create or replace function public.sync_menu_category_rename()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.name is distinct from old.name then
    update public.menu_items set category = new.name where category = old.name;
  end if;
  return new;
end;
$$;

drop trigger if exists menu_categories_rename on public.menu_categories;
create trigger menu_categories_rename
  after update on public.menu_categories
  for each row execute function public.sync_menu_category_rename();
