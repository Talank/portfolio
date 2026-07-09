// shared/supabase-client.js
// Fill these in from Supabase → Project Settings → API after following
// supabase/SETUP.md. The URL + anon key are meant to be public — they are
// safe to publish in client-side code because every table is locked down
// with row-level security (see supabase/schema.sql), not by hiding the key.
const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';

// Until real credentials are filled in above, leave window.sb unset so every
// caller's "if (window.sb) ..." guard treats the site as signed-out/offline
// instead of throwing on a fake URL.
window.sb = SUPABASE_URL.includes('YOUR-PROJECT-REF')
  ? null
  : supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
