# docs

The database schema now lives as a Supabase migration:

    supabase/migrations/20260903195708_catering_schema.sql

Apply it with `yarn db:push` (see the root README section on the admin panel).
Edit that file rather than keeping a second copy here — `supabase db push` is
the only thing that runs it.
