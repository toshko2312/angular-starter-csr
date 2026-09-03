-- ---------------------------------------------------------------------------
-- Catering site schema. Applied with `yarn db:push`.
--
-- The anon key ships inside the browser bundle, so every policy below is
-- written on the assumption that anyone can call the API with it. Read access
-- is granted only where the data is already public; `enquiries` is
-- insert-only, with NO select policy, so visitors cannot read each other's
-- submissions.
-- ---------------------------------------------------------------------------

-- ------------------------------------------------------------------ menu_items

create table if not exists public.menu_items (
  id          text primary key,
  name        text        not null,
  category    text        not null,
  price       numeric(10,2) not null,
  unit        text        not null,
  description text        not null default '',
  image_path  text,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.menu_items enable row level security;

-- Public catalogue: anyone may read, nobody may write through the anon key.
drop policy if exists "menu_items are publicly readable" on public.menu_items;
create policy "menu_items are publicly readable"
  on public.menu_items for select
  to anon, authenticated
  using (true);

-- ------------------------------------------------------------------- enquiries

create table if not exists public.enquiries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text        not null,
  email       text        not null,
  phone       text,
  event_date  date,
  guests      int,
  event_type  text,
  location    text,
  message     text        not null,
  cart_lines  jsonb       not null default '[]'::jsonb
);

alter table public.enquiries enable row level security;

-- Insert-only. Deliberately no select/update/delete policy for anon: with RLS
-- on and no policy, those operations are denied. Read submissions from the
-- dashboard or with the service_role key server-side.
drop policy if exists "anyone may submit an enquiry" on public.enquiries;
create policy "anyone may submit an enquiry"
  on public.enquiries for insert
  to anon, authenticated
  with check (true);

-- ------------------------------------------------------------------ menu seed
-- Ported from the design's MENU array. image_path is left null; the cards fall
-- back to the hatched placeholder until you fill in image URLs.

insert into public.menu_items (id, name, category, price, unit, description, sort_order) values
  ('m1',  'Мини брускети',                    'Хапки',   1.80, '€/бр.',     'Печен домат, моцарела и босилек върху хрупкав багет.',        1),
  ('m2',  'Плато сирена',                     'Хапки',  24.00, '€/плато',   'Пет вида сирена, орехи, мед и сушени плодове.',                2),
  ('m3',  'Тарталети с крем от синьо сирене', 'Хапки',   2.20, '€/бр.',     'Маслено тесто, крем от синьо сирене и круша.',                3),
  ('m4',  'Салата Капрезе',                   'Салати',  7.50, '€/порция',  'Домати, буфалска моцарела, зехтин и пресен босилек.',         4),
  ('m5',  'Гръцка салата',                    'Салати',  6.90, '€/порция',  'Краставица, домат, маслини, червен лук и фета.',              5),
  ('m6',  'Печено пиле с билки',              'Основни',12.50, '€/порция',  'Мариновано пилешко бутче с розмарин и печени картофи.',       6),
  ('m7',  'Свинско бонфиле',                  'Основни',16.90, '€/порция',  'Бонфиле със сос от червено вино и картофено пюре.',           7),
  ('m8',  'Ризото с горски гъби',             'Основни',11.50, '€/порция',  'Арборио, горски гъби, пармезан и трюфелово масло.',           8),
  ('m9',  'Тирамису',                         'Десерти', 5.50, '€/бр.',     'Класическо тирамису с маскарпоне и еспресо.',                 9),
  ('m10', 'Профитероли',                      'Десерти', 4.80, '€/бр.',     'Еклерово тесто с ванилов крем и топъл шоколад.',             10),
  ('m11', 'Домашна лимонада',                 'Напитки', 3.50, '€/л',       'Прясно изцеден лимон, мента и лед.',                         11),
  ('m12', 'Плодов пунш',                      'Напитки', 4.20, '€/л',       'Сезонни плодове, портокал и джинджифил.',                    12)
on conflict (id) do nothing;


-- ===========================================================================
-- ADMIN PANEL (/admin)
--
-- The app is client-side only: the anon key ships inside the browser bundle,
-- so it must never be able to write. Write access is granted to the
-- `authenticated` role instead, which a visitor only holds after a real
-- Supabase Auth login. This is what actually protects the data — the login
-- screen is only the UI in front of it.
-- ===========================================================================

-- ---------------------------------------------------------------- menu_items

drop policy if exists "authenticated may write menu_items" on public.menu_items;
create policy "authenticated may write menu_items"
  on public.menu_items for all
  to authenticated
  using (true) with check (true);

-- ------------------------------------------------------------------ projects
-- This table predates this file. Verify its existing policies in the
-- dashboard; the SELECT policy below is a no-op if you already have one.

alter table public.projects enable row level security;

drop policy if exists "projects are publicly readable" on public.projects;
create policy "projects are publicly readable"
  on public.projects for select
  to anon, authenticated
  using (true);

drop policy if exists "authenticated may write projects" on public.projects;
create policy "authenticated may write projects"
  on public.projects for all
  to authenticated
  using (true) with check (true);

-- ------------------------------------------------------------------- storage
-- Bucket for menu photos and project galleries. Create it first:
--   Dashboard -> Storage -> New bucket -> name "media", Public bucket ON.
-- Public read is what lets <img src> work for visitors; only a logged-in
-- admin may add or remove files.

drop policy if exists "media is publicly readable" on storage.objects;
create policy "media is publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "authenticated may write media" on storage.objects;
create policy "authenticated may write media"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'media') with check (bucket_id = 'media');

-- --------------------------------------------------------------- admin user
-- Create the login by hand — a user cannot be seeded safely from SQL:
--
--   Dashboard -> Authentication -> Users -> Add user -> Create new user
--     Email:    the address you put in ADMIN_EMAIL in .env
--     Password: something strong; this is a publicly reachable login
--     Auto Confirm User: ON  (otherwise sign-in fails on an unconfirmed email)
--
-- Nothing else grants write access, so this user is the only way in.
