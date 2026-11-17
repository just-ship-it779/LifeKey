/*
  config.js — LifeKey configuration
  ───────────────────────────────────────────────────────────────
  PURPOSE: This file holds the Supabase project URL and the
  "anon key" (short for "anonymous key") that the browser uses
  to talk to our database and storage.

  IMPORTANT SECURITY NOTE:
  - The SUPABASE_URL and SUPABASE_ANON_KEY are SAFE to put in
    browser code.  Supabase intentionally makes these public.
  - The anon key only gets the permissions that the database
    policies allow.  It cannot do anything the policies forbid.
  - There is ANOTHER key called the "service role key" — that
    one is SECRET and must NEVER go in browser code.

  HOW TO FILL THIS IN:
  1.  Go to https://app.supabase.com
  2.  Open your project → Settings → API
  3.  Copy "Project URL" → paste as SUPABASE_URL below
  4.  Copy "anon public" key → paste as SUPABASE_ANON_KEY below

  For now the placeholders are left as-is.
  We will fill them in during Phase 2.
  ───────────────────────────────────────────────────────────────
*/

const SUPABASE_URL      = 'https://fzhdwacgbxakhbcttaln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aGR3YWNnYnhha2hiY3R0YWxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2ODY1NTcsImV4cCI6MjEwODI2MjU1N30.2Zxkc0UjR5fxbCvggUpj7ErUBRJndfwBBZ5joD3ya8I';

/*
  SITE_URL is the address of this website after deployment.
  The QR code will point to:  SITE_URL + /public-record.html?user=<user_id>

  During development:  http://localhost:5500  (or wherever you preview)
  After deployment:    https://your-site.netlify.app  (we'll update in Phase 7)
*/
const SITE_URL = 'https://life-key.netlify.app';
