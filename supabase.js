/*
  supabase.js — Supabase client setup
  ───────────────────────────────────────────────────────────────
  PURPOSE: Creates ONE shared Supabase client object that every
  other script (app.js, etc.) can use to talk to the database,
  authentication service, and file storage.

  WHAT IS A "CLIENT"?
  Think of it like a phone that's already pre-dialled to Supabase.
  Instead of setting up the connection every time, we build it
  once here and reuse it everywhere.

  HOW IT WORKS:
  - The <script> tag in index.html loads the official Supabase
    JavaScript library first, which puts the `supabase` global
    object on the window.
  - We call supabase.createClient(url, key) with our project's
    URL and the safe anon key from config.js.
  - The resulting `supabaseClient` is stored in window scope so
    every other script can use it.
  ───────────────────────────────────────────────────────────────
*/

// supabase.createClient comes from the CDN script loaded in index.html
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
