-- ---------------------------------------------------------------------------
-- Admin access to submitted requests (/admin/requests).
--
-- The base schema left `enquiries` insert-only, so submissions could only be
-- read from the dashboard. The panel now lists them, which needs SELECT for the
-- `authenticated` role, plus UPDATE (mark handled) and DELETE. Anon keeps its
-- insert-only policy: a visitor still cannot read anyone's submission.
-- ---------------------------------------------------------------------------

alter table public.enquiries
  add column if not exists handled    boolean not null default false,
  add column if not exists handled_at timestamptz;

-- The panel lists newest-first.
create index if not exists enquiries_created_at_idx
  on public.enquiries (created_at desc);

drop policy if exists "authenticated may read enquiries" on public.enquiries;
create policy "authenticated may read enquiries"
  on public.enquiries for select
  to authenticated
  using (true);

drop policy if exists "authenticated may update enquiries" on public.enquiries;
create policy "authenticated may update enquiries"
  on public.enquiries for update
  to authenticated
  using (true) with check (true);

drop policy if exists "authenticated may delete enquiries" on public.enquiries;
create policy "authenticated may delete enquiries"
  on public.enquiries for delete
  to authenticated
  using (true);
