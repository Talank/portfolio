# Supabase setup (one-time, manual)

This site is fully static (GitHub Pages) and works with zero setup below —
quizzes and content are never gated behind sign-in. These steps only enable
optional cross-device sync of DSA_tool progress/notes and NCLEX attempt
history. Skip this entirely and the site still works exactly as before,
saving progress to each browser's `localStorage`.

## 1. Create the project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick a name (e.g. `talank-portfolio`), generate a database password and
   save it somewhere safe, pick the region closest to you, Free plan.
3. Wait ~2 minutes for provisioning.

## 2. Configure auth providers

**Authentication → Providers → Email**
- Keep it enabled.
- Open its settings and turn **"Confirm email" OFF**. The free plan's
  built-in email sending is capped around 2-4 emails/hour — turning this off
  avoids burning that quota on signup confirmations. (See caveats below.)

**Authentication → Providers → Google**
- Toggle it on. Supabase shows a callback URL like
  `https://<project-ref>.supabase.co/auth/v1/callback`.
- In a separate tab: [Google Cloud Console](https://console.cloud.google.com)
  → APIs & Services → Credentials → **Create Credentials → OAuth client ID**
  → Application type: Web application.
- Paste the Supabase callback URL into **Authorized redirect URIs** → Create.
- Copy the generated **Client ID** and **Client Secret** back into the
  Supabase Google provider fields → Save.

## 3. Set allowed URLs

**Authentication → URL Configuration**
- Site URL: `https://talank.com.np`
- Additional Redirect URLs: add `http://localhost:8000/**` (the trailing
  `/**` wildcard matters — both `nclex/` and `DSA_tool/` live at sub-paths
  under that local port).

## 4. Get your API credentials

**Project Settings → API**
- Copy the **Project URL**.
- Copy the **`anon` `public`** key (never the `service_role` key — that one
  bypasses row-level security and must never appear in client-side code).
- Paste both into `shared/supabase-client.js` (replace the placeholder
  constants at the top of the file).

## 5. Create the database tables

**SQL Editor → New query** → paste the contents of `supabase/schema.sql` →
**Run**.

Then check **Table Editor** — you should see `dsa_progress`, `dsa_notes`,
and `nclex_attempts`, each with the RLS "shield" icon showing as enabled.

## Caveats worth knowing

- **Auto-pause on inactivity**: free-tier projects pause after 7 days with
  zero API requests. For a low-traffic personal site this will happen
  eventually — resuming just takes one "Restore project" click in the
  dashboard (a couple of minutes), no data is lost.
- **Email sending is rate-limited** (~2-4/hour on the free plan). That's why
  Google is the primary sign-in path here, email confirmation is off, and
  the email/password fallback uses a password (not a magic link) — magic
  links would exhaust that quota almost immediately under any real usage.
