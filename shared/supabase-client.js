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
//
// The supabase-js CDN bundle is loaded lazily from here (not via a <script>
// tag on every page) so no page's first paint ever waits on the CDN. Pages
// must not assume window.sb is set synchronously: when the bundle finishes
// loading, an 'sb:ready' event fires on window (auth-ui.js listens for it).
window.sb = null;
if (!SUPABASE_URL.includes('YOUR-PROJECT-REF')) {
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  s.async = true;
  s.onload = () => {
    window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.dispatchEvent(new CustomEvent('sb:ready'));
  };
  document.head.appendChild(s);
}
