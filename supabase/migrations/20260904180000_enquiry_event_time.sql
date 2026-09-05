-- ===========================================================================
-- EVENT TIME ON AN ENQUIRY
--
-- Two columns rather than one nullable time: "they told us they do not know
-- yet" and "they left the field alone" read differently to whoever answers the
-- request, and the form makes that state explicit with its own toggle.
--
-- Existing rows take the defaults (null / false), so nothing has to be
-- backfilled. The anon insert policy is `with check (true)` and the admin
-- select/update grants in 20260904120000_enquiry_admin.sql are table-wide, so
-- no policy changes are needed either.
-- ===========================================================================

alter table public.enquiries
  add column if not exists event_time         time,
  add column if not exists event_time_unknown boolean not null default false;
