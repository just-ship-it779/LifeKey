/*
  app.js — LifeKey main application logic
  ───────────────────────────────────────────────────────────────
  This file runs in the browser and controls everything the user
  sees and does.

  HOW IT IS ORGANISED:
  1.  Screen & navigation helpers  — show/hide screens and sections
  2.  Session / auth init          — check if the user is logged in on page load
  3.  Auth handlers                — login, signup, logout
  4.  Profile handlers             — load, save the medical profile
  5.  Medical card                 — populate the card and generate the QR code
  6.  Report handlers              — upload, list, open, delete reports
  7.  Utility helpers              — show messages, format dates, etc.

  IMPORTANT: Supabase operations are stubs (placeholders) for now.
  We will fill them in during Phase 3 (auth), Phase 4 (profile),
  Phase 5 (card), and Phase 6 (reports).
  ───────────────────────────────────────────────────────────────
*/

'use strict';

/* ════════════════════════════════════════════════════════════
   1. SCREEN & NAVIGATION HELPERS
   These functions show one screen at a time by toggling the
   CSS class "hidden" on the three top-level divs.
════════════════════════════════════════════════════════════ */

/*
  showScreen(name)
  ─────────────────
  Shows one of the three top-level screens:
    'home'   → landing page (visitor not logged in)
    'auth'   → login / signup forms
    'app'    → dashboard (logged-in user)

  It hides all three first, then shows the requested one.
*/
function showScreen(name) {
  document.getElementById('home-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.add('hidden');

  if (name === 'home')  document.getElementById('home-screen').classList.remove('hidden');
  if (name === 'auth')  document.getElementById('auth-screen').classList.remove('hidden');
  if (name === 'app')   document.getElementById('app-screen').classList.remove('hidden');
}

/*
  showAuthScreen(tab)
  ─────────────────────
  Shows the auth screen AND activates either the login or signup tab.
  Called when the user clicks "Log In" or "Get Started".
  Also clears the forms and any leftover messages so the user
  always starts with a clean form.
*/
function showAuthScreen(tab) {
  // Clear all auth form fields and messages
  document.getElementById('login-email').value    = '';
  document.getElementById('login-password').value = '';
  document.getElementById('signup-email').value    = '';
  document.getElementById('signup-password').value = '';
  document.getElementById('login-message').className  = 'form-message';
  document.getElementById('login-message').textContent = '';
  document.getElementById('signup-message').className  = 'form-message';
  document.getElementById('signup-message').textContent = '';

  showScreen('auth');
  showTab(tab);
}

/*
  showTab(tab)
  ─────────────
  Switches between the login and signup forms inside the auth card.
  Preserved from the original design.
*/
function showTab(tab) {
  const loginForm   = document.getElementById('login-form');
  const signupForm  = document.getElementById('signup-form');
  const tabLogin    = document.getElementById('tab-login');
  const tabSignup   = document.getElementById('tab-signup');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
  } else {
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
  }
}

/*
  showSection(name)
  ──────────────────
  Inside the logged-in app, shows one of the four sections:
  dashboard, profile, card, or reports.

  It also updates the "active" highlight on the top nav buttons
  using the data-section attribute we added in the HTML.
*/
function showSection(name) {
  // Hide all app sections
  ['dashboard', 'profile', 'card', 'reports'].forEach(s => {
    document.getElementById('section-' + s).classList.add('hidden');
  });

  // Show the requested one
  document.getElementById('section-' + name).classList.remove('hidden');

  // Update nav button styles
  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.dataset.section === name) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Close mobile menu if open
  document.getElementById('mobile-menu').classList.add('hidden');

  // If showing the card section, refresh the card preview
  if (name === 'card') refreshCardPreview();
}

/*
  toggleMobileMenu()
  ───────────────────
  Shows or hides the mobile dropdown inside the app nav bar.
*/
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('hidden');
}

/*
  toggleLandingMenu()
  ────────────────────
  Shows or hides the mobile dropdown inside the landing page nav bar.
*/
function toggleLandingMenu() {
  const menu = document.getElementById('lnav-mobile');
  menu.classList.toggle('hidden');
}


/* ════════════════════════════════════════════════════════════
   2. SESSION / AUTH INIT
   Runs once when the page loads. Checks if the user already
   has a valid session in the browser. If yes → go straight
   to the dashboard. If no → show the homepage.
════════════════════════════════════════════════════════════ */

/*
  In-memory store for the current user's data.
  We keep this here so profile and reports functions can access it.
*/
let currentUser    = null;  // Supabase user object (has .id, .email)
let currentProfile = null;  // Profile data from the database
let currentReports = [];    // Array of report metadata from the database

/*
  initApp()
  ──────────
  Called once when the page finishes loading (see bottom of this file).
  It asks Supabase: "Is there a logged-in user right now?"
  and navigates to the right screen accordingly.

  HOW SESSIONS WORK:
  When a user logs in, Supabase stores a "session token" in the
  browser's localStorage. Next time they open the page, we read
  that token — if it's still valid, we skip the login screen
  entirely and go straight to the dashboard.
*/
async function initApp() {
  // Ask Supabase: is there a currently active session?
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session) {
    // A valid session exists — user is already logged in
    currentUser = session.user;
    await loadUserData();
    showScreen('app');
  } else {
    // No session — show the public homepage
    showScreen('home');
  }

  /*
    onAuthStateChange listens for auth events that happen AFTER
    the page loads. For example:
    - User logs in on another tab  -> SIGNED_IN fires here too
    - Session expires              -> SIGNED_OUT fires, we go back to homepage
    - User logs out                -> SIGNED_OUT fires
  */
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      const emailEl = document.getElementById('nav-user-email');
      if (emailEl) emailEl.textContent = currentUser.email;
      const avatarEl = document.getElementById('nav-user-avatar');
      if (avatarEl) avatarEl.textContent = currentUser.email[0].toUpperCase();
    } else if (event === 'SIGNED_OUT') {
      currentUser    = null;
      currentProfile = null;
      currentReports = [];
      showScreen('home');
    }
  });
}


/* ════════════════════════════════════════════════════════════
   3. AUTH HANDLERS
   These functions are called by the form onsubmit events in
   index.html.  They will call Supabase auth in Phase 3.
════════════════════════════════════════════════════════════ */

/*
  handleLogin(event)
  ───────────────────
  supabaseClient.auth.signInWithPassword() checks the email and
  password against Supabase Auth. If correct, Supabase returns a
  session and stores it in the browser automatically.
*/
async function handleLogin(event) {
  event.preventDefault();

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('login-btn');
  const msg      = document.getElementById('login-message');

  setButtonLoading(btn, true, 'Logging in…');
  clearMessage(msg);

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    showMessage(msg, 'error', error.message);
    setButtonLoading(btn, false, 'Log In');
    return;
  }

  // Login succeeded
  currentUser = data.user;
  await loadUserData();
  showScreen('app');
  setButtonLoading(btn, false, 'Log In');
}

/*
  handleSignup(event)
  ────────────────────
  Creates a new account in Supabase Auth.
  By default Supabase sends a confirmation email first.
  For easy testing, we will turn that off in a moment.
*/
async function handleSignup(event) {
  event.preventDefault();

  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const btn      = document.getElementById('signup-btn');
  const msg      = document.getElementById('signup-message');

  setButtonLoading(btn, true, 'Creating account…');
  clearMessage(msg);

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
  });

  if (error) {
    showMessage(msg, 'error', error.message);
    setButtonLoading(btn, false, 'Create Account');
    return;
  }

  if (data.session) {
    // Email confirmation disabled — logged in immediately
    currentUser = data.user;
    await loadUserData();
    showScreen('app');
  } else {
    // Email confirmation enabled — ask user to check inbox
    showMessage(
      msg,
      'success',
      'Account created! Check your email for a confirmation link, then log in.'
    );
  }

  setButtonLoading(btn, false, 'Create Account');
}

/*
  handleLogout()
  ───────────────
  Signs the user out. Supabase clears the session token from
  the browser. onAuthStateChange fires with SIGNED_OUT and
  redirects to the homepage automatically.
*/
async function handleLogout() {
  await supabaseClient.auth.signOut();
}


/* ════════════════════════════════════════════════════════════
   4. PROFILE HANDLERS
════════════════════════════════════════════════════════════ */

/*
  loadUserData()
  ───────────────
  Called after login. Loads the profile and reports from Supabase
  so the dashboard shows real data straight away.
*/
async function loadUserData() {
  await loadProfile();
  await loadReports();
  updateDashboardStats();

  // Show the logged-in user's email in the nav bar
  if (currentUser) {
    const emailEl = document.getElementById('nav-user-email');
    if (emailEl) emailEl.textContent = currentUser.email;
    const avatarEl = document.getElementById('nav-user-avatar');
    if (avatarEl) avatarEl.textContent = currentUser.email[0].toUpperCase();
  }
}

/*
  loadProfile()
  ──────────────
  Fetches this user's profile row from the `profiles` table.
  Uses .eq('user_id', currentUser.id) to get ONLY this user's row —
  the RLS policy on the database also enforces this as a second layer.
  If no profile exists yet (new user), currentProfile stays null.
*/
async function loadProfile() {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', currentUser.id)
    .single();  // .single() means "expect exactly one row or nothing"

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = "no rows found" — that's fine for a new user
    // Any other error code is a real problem worth logging
    console.error('Error loading profile:', error.message);
    return;
  }

  currentProfile = data || null;

  // Pre-fill the profile form with whatever we loaded
  populateProfileForm();
}

/*
  handleProfileSave(event)
  ─────────────────────────
  Called when the user submits the profile form.
  Uses "upsert" — that means INSERT if no row exists yet,
  or UPDATE if a row already exists. We match on user_id.
*/
async function handleProfileSave(event) {
  event.preventDefault();

  const btn = document.getElementById('profile-save-btn');
  const msg = document.getElementById('profile-message');

  // Gather all field values from the form
  const profileData = {
    user_id:         currentUser.id,
    full_name:       document.getElementById('p-name').value.trim(),
    date_of_birth:   document.getElementById('p-dob').value || null,
    blood_group:     document.getElementById('p-blood').value,
    allergies:       document.getElementById('p-allergies').value.trim(),
    conditions:      document.getElementById('p-conditions').value.trim(),
    medications:     document.getElementById('p-medications').value.trim(),
    emergency_name:  document.getElementById('p-ec-name').value.trim(),
    emergency_phone: document.getElementById('p-ec-phone').value.trim(),
    notes:           document.getElementById('p-notes').value.trim(),
    updated_at:      new Date().toISOString(),
  };

  // Basic validation — full name is the only required field
  if (!profileData.full_name) {
    showMessage(msg, 'error', 'Full name is required.');
    return;
  }

  setButtonLoading(btn, true, 'Saving…');
  clearMessage(msg);

  /*
    .upsert() tries to insert a new row first.
    If a row with the same user_id already exists (because the user
    saved before), it updates that row instead.
    onConflict: 'user_id' tells Supabase which column to check for duplicates.
  */
  const { error } = await supabaseClient
    .from('profiles')
    .upsert(profileData, { onConflict: 'user_id' });

  if (error) {
    showMessage(msg, 'error', 'Could not save profile: ' + error.message);
    setButtonLoading(btn, false, 'Save Profile');
    return;
  }

  // Update our in-memory copy so the rest of the app reflects the change
  currentProfile = profileData;
  showMessage(msg, 'success', '✅ Profile saved successfully!');
  updateDashboardStats();
  setButtonLoading(btn, false, 'Save Profile');
}

/*
  populateProfileForm()
  ──────────────────────
  Fills the profile form with the saved profile data when the user
  navigates to the profile section.
*/
function populateProfileForm() {
  if (!currentProfile) return;
  document.getElementById('p-name').value        = currentProfile.full_name       || '';
  document.getElementById('p-dob').value         = currentProfile.date_of_birth   || '';
  document.getElementById('p-blood').value       = currentProfile.blood_group     || 'Unknown';
  document.getElementById('p-allergies').value   = currentProfile.allergies       || '';
  document.getElementById('p-conditions').value  = currentProfile.conditions      || '';
  document.getElementById('p-medications').value = currentProfile.medications     || '';
  document.getElementById('p-ec-name').value     = currentProfile.emergency_name  || '';
  document.getElementById('p-ec-phone').value    = currentProfile.emergency_phone || '';
  document.getElementById('p-notes').value       = currentProfile.notes           || '';
}


/* ════════════════════════════════════════════════════════════
   5. MEDICAL CARD
════════════════════════════════════════════════════════════ */

// Holds the QR code instance so we can destroy and recreate it
let qrInstance = null;

/*
  refreshCardPreview()
  ─────────────────────
  Called whenever the user navigates to the Medical Card section.
  Populates BOTH the on-screen preview cards AND the hidden print
  sheet cards with data from currentProfile, then generates QR codes.
*/
function refreshCardPreview() {
  const noProfile = document.getElementById('card-no-profile');
  const wrapper   = document.getElementById('card-preview-wrapper');

  if (!currentProfile || !currentProfile.full_name) {
    noProfile.classList.remove('hidden');
    wrapper.classList.add('hidden');
    return;
  }

  noProfile.classList.add('hidden');
  wrapper.classList.remove('hidden');

  const p   = currentProfile;
  const dob = p.date_of_birth ? 'DOB · ' + formatDate(p.date_of_birth) : '';
  const ec  = buildEmergencyText();

  // ── Populate the screen preview (ids without -print suffix) ──
  document.getElementById('mc-name').textContent       = p.full_name  || '—';
  document.getElementById('mc-dob').textContent        = dob;
  document.getElementById('mc-blood').textContent      = p.blood_group || '—';
  document.getElementById('mc-allergies').textContent  = p.allergies  || '';
  document.getElementById('mc-conditions').textContent = p.conditions || '';
  document.getElementById('mc-emergency').textContent  = ec;

  // Hide rows whose fields are empty
  setRowVisible('cc-allergy-row',    !!p.allergies);
  setRowVisible('cc-conditions-row', !!p.conditions);
  setRowVisible('cc-emergency-row',  !!(p.emergency_name || p.emergency_phone));

  // ── Populate the print sheet card (ids with -print suffix) ──
  document.getElementById('mc-name-print').textContent       = p.full_name  || '—';
  document.getElementById('mc-dob-print').textContent        = dob;
  document.getElementById('mc-blood-print').textContent      = p.blood_group || '—';
  document.getElementById('mc-allergies-print').textContent  = p.allergies  || '';
  document.getElementById('mc-conditions-print').textContent = p.conditions || '';
  document.getElementById('mc-emergency-print').textContent  = ec;

  setRowVisible('cc-allergy-row-print',    !!p.allergies);
  setRowVisible('cc-conditions-row-print', !!p.conditions);
  setRowVisible('cc-emergency-row-print',  !!(p.emergency_name || p.emergency_phone));

  // Generate QR codes in both containers
  generateQR();
}

/*
  setRowVisible(id, visible)
  ───────────────────────────
  Shows or hides a card info row by ID.
  We hide rows when the field is empty so the card doesn't show "—" everywhere.
*/
function setRowVisible(id, visible) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = visible ? '' : 'none';
}

/*
  buildEmergencyText()
  ─────────────────────
  Combines emergency contact name and phone into one short string.
*/
function buildEmergencyText() {
  const name  = currentProfile.emergency_name  || '';
  const phone = currentProfile.emergency_phone || '';
  if (!name && !phone) return '';
  if (!phone) return name;
  if (!name)  return phone;
  return name + ' · ' + phone;
}

/*
  generateQR()
  ─────────────
  Creates QR codes in BOTH card containers:
  - #mc-qr       → the on-screen preview card
  - #mc-qr-print → the hidden print sheet card

  Both encode the same URL (the user's public record page).
  The QR URL is unchanged from before — this is the same destination
  that was working in Phase 5.
*/
function generateQR() {
  const userId = (currentUser && currentUser.id) ? currentUser.id : 'demo-user-id';
  const qrUrl  = SITE_URL + '/public-record.html?user=' + userId;

  // QR options — dark ink on white, high contrast for reliable scanning
  const qrOptions = {
    text:         qrUrl,
    width:        58,
    height:       58,
    colorDark:    '#2c3e35',   // Calm Care ink colour
    colorLight:   '#ffffff',
    correctLevel: QRCode.CorrectLevel.M,
  };

  // Generate in the screen card
  const screenContainer = document.getElementById('mc-qr');
  if (screenContainer) {
    screenContainer.innerHTML = '';
    try { new QRCode(screenContainer, qrOptions); }
    catch (e) { console.warn('Screen QR failed:', e); }
  }

  // Generate in the print card (slightly larger for physical scanning)
  const printContainer = document.getElementById('mc-qr-print');
  if (printContainer) {
    printContainer.innerHTML = '';
    try {
      new QRCode(printContainer, { ...qrOptions, width: 64, height: 64 });
    }
    catch (e) { console.warn('Print QR failed:', e); }
  }
}

/*
  printCard()
  ────────────
  Triggers the browser print dialog.
  @media print in style.css hides the whole app and shows only
  #print-sheet — the A4 landscape layout with both card faces.
*/
function printCard() {
  window.print();
}


/* ════════════════════════════════════════════════════════════
   6. REPORT HANDLERS
════════════════════════════════════════════════════════════ */

/*
  handleReportUpload(event)
  ──────────────────────────
  Called when the user submits the report upload form.

  STEP 1 — Validate the file (type and size).
  STEP 2 — Build a unique file path:
            userId/timestamp_filename
            Storing under the user's ID keeps each user's files
            in their own "folder" inside the bucket.
  STEP 3 — Upload the file to the "reports" Supabase Storage bucket.
  STEP 4 — Save the metadata (type, date, hospital, file path…)
            to the medical_records table.
  STEP 5 — Reload the report list so the new report appears.
*/
async function handleReportUpload(event) {
  event.preventDefault();

  const btn  = document.getElementById('upload-btn');
  const msg  = document.getElementById('upload-message');
  const file = document.getElementById('r-file').files[0];

  clearMessage(msg);

  // ── STEP 1: Validate ──────────────────────────────────────
  if (!file) {
    showMessage(msg, 'error', 'Please choose a file to upload.');
    return;
  }

  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowed.includes(file.type)) {
    showMessage(msg, 'error', 'Only PDF, JPG, and PNG files are supported.');
    return;
  }

  const maxBytes = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxBytes) {
    showMessage(msg, 'error', 'File is too large. Maximum size is 10 MB.');
    return;
  }

  const reportType = document.getElementById('r-type').value;
  const reportDate = document.getElementById('r-date').value;
  const hospital   = document.getElementById('r-hospital').value.trim();

  setButtonLoading(btn, true, 'Uploading…');
  showProgressBar(true);

  // ── STEP 2: Build a unique file path ─────────────────────
  /*
    We store files as:  userId/timestamp-originalfilename
    The userId prefix creates a virtual folder per user.
    The timestamp ensures no two uploads ever overwrite each other.
    We strip spaces from the filename to avoid URL encoding issues.
  */
  const safeName = file.name.replace(/\s+/g, '_');
  const filePath = `${currentUser.id}/${Date.now()}_${safeName}`;

  // ── STEP 3: Upload to Supabase Storage ───────────────────
  const { error: uploadError } = await supabaseClient
    .storage
    .from('reports')       // the bucket we created in Phase 2
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,       // never silently overwrite — always a new file
    });

  if (uploadError) {
    showMessage(msg, 'error', 'Upload failed: ' + uploadError.message);
    showProgressBar(false);
    setButtonLoading(btn, false, 'Upload Report');
    return;
  }

  // ── STEP 4: Save metadata to the database ────────────────
  /*
    We store the file_path (not the full URL) in the database.
    The full URL is reconstructed whenever we need it using
    supabaseClient.storage.from('reports').getPublicUrl(file_path).
    This way if the storage URL changes, we don't need to update
    every row in the database.
  */
  const { error: dbError } = await supabaseClient
    .from('medical_records')
    .insert({
      user_id:           currentUser.id,
      report_type:       reportType,
      report_date:       reportDate,
      hospital:          hospital,
      file_path:         filePath,
      original_filename: file.name,
      file_type:         file.type,
    });

  if (dbError) {
    showMessage(msg, 'error', 'File uploaded but metadata save failed: ' + dbError.message);
    showProgressBar(false);
    setButtonLoading(btn, false, 'Upload Report');
    return;
  }

  // ── STEP 5: Reload the report list ───────────────────────
  showProgressBar(false);
  setButtonLoading(btn, false, 'Upload Report');
  showMessage(msg, 'success', '✅ Report uploaded successfully!');

  document.getElementById('report-form').reset();
  clearFileChosen();

  // Fetch the fresh list from Supabase and re-render
  await loadReports();
  updateDashboardStats();
}

/*
  loadReports()
  ──────────────
  Fetches all report metadata rows for the current user from the
  medical_records table, then calls getPublicUrl() for each one
  to build the direct file link, and finally renders the list.
*/
async function loadReports() {
  const { data, error } = await supabaseClient
    .from('medical_records')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('report_date', { ascending: false });

  if (error) {
    console.error('Error loading reports:', error.message);
    currentReports = [];
    renderReports();
    return;
  }

  /*
    For each row, add a file_url property so the rest of the app
    can open the file without knowing about storage bucket URLs.
    getPublicUrl() is synchronous — it just builds the URL string,
    it does not make a network request.
  */
  currentReports = (data || []).map(row => {
    const { data: urlData } = supabaseClient
      .storage
      .from('reports')
      .getPublicUrl(row.file_path);
    return { ...row, file_url: urlData.publicUrl };
  });

  renderReports();
}

/*
  renderReports()
  ────────────────
  Reads currentReports (the in-memory array), sorts it according
  to the sort dropdown, and renders the report list into the DOM.

  This is called by:
  - loadReports() after fetching from Supabase
  - The sort dropdown's onchange handler (in index.html)
*/
function renderReports() {
  const container   = document.getElementById('reports-container');
  const emptyState  = document.getElementById('reports-empty');
  const sortValue   = document.getElementById('sort-reports').value;

  // Sort a copy so we don't mutate the original array
  const sorted = [...currentReports].sort((a, b) => {
    if (sortValue === 'date-desc')    return new Date(b.report_date) - new Date(a.report_date);
    if (sortValue === 'date-asc')     return new Date(a.report_date) - new Date(b.report_date);
    if (sortValue === 'hospital-asc') return a.hospital.localeCompare(b.hospital);
    return 0;
  });

  // Remove old report items (but keep the empty state element)
  container.querySelectorAll('.report-item').forEach(el => el.remove());

  if (sorted.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  sorted.forEach(report => {
    const item = buildReportItem(report);
    container.appendChild(item);
  });

  // Update dashboard count
  updateDashboardStats();
}

/*
  buildReportItem(report)
  ────────────────────────
  Creates and returns a single report card DOM element.
  The report object has fields: id, report_type, report_date,
  hospital, file_url, original_filename, file_type.
*/
function buildReportItem(report) {
  const div = document.createElement('div');
  div.className = 'report-item';
  div.dataset.id = report.id;

  // File type badge
  const ext = (report.file_type || '').replace('image/', '').replace('application/', '').toUpperCase();

  div.innerHTML = `
    <div class="report-icon-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    </div>
    <div class="report-info">
      <div class="report-type">
        ${escHtml(report.report_type)}
        <span class="report-badge">${escHtml(ext)}</span>
      </div>
      <div class="report-meta">
        ${formatDate(report.report_date)} &nbsp;·&nbsp; ${escHtml(report.hospital)}
        <br>${escHtml(report.original_filename || '')}
      </div>
    </div>
    <div class="report-actions">
      <a href="${report.file_url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">View</a>
      <button class="btn btn-danger btn-sm" onclick="handleDeleteReport('${report.id}')">Delete</button>
    </div>
  `;
  return div;
}

/*
  handleDeleteReport(reportId)
  ─────────────────────────────
  1. Find the report in our in-memory array to get the file_path.
  2. Delete the file from Supabase Storage.
  3. Delete the metadata row from the database.
  4. Remove it from the in-memory array and re-render.

  We delete storage first. If that fails we stop — no orphan DB rows.
  If DB delete fails after storage is deleted, the row stays but the
  file is gone — a minor inconsistency acceptable for a demo.
*/
async function handleDeleteReport(reportId) {
  if (!confirm('Delete this report? This cannot be undone.')) return;

  // Find the report object so we have its file_path
  const report = currentReports.find(r => r.id === reportId);
  if (!report) return;

  // Step 1 — Delete the file from storage
  const { error: storageError } = await supabaseClient
    .storage
    .from('reports')
    .remove([report.file_path]);

  if (storageError) {
    alert('Could not delete file: ' + storageError.message);
    return;
  }

  // Step 2 — Delete the metadata row from the database
  const { error: dbError } = await supabaseClient
    .from('medical_records')
    .delete()
    .eq('id', reportId);

  if (dbError) {
    alert('File deleted but database record removal failed: ' + dbError.message);
    return;
  }

  // Step 3 — Remove from local array and re-render
  currentReports = currentReports.filter(r => r.id !== reportId);
  renderReports();
  updateDashboardStats();
}


/* ════════════════════════════════════════════════════════════
   7. DASHBOARD STATS
════════════════════════════════════════════════════════════ */

/*
  updateDashboardStats()
  ───────────────────────
  Updates the three summary cards on the dashboard with
  real data from currentProfile and currentReports.
*/
function updateDashboardStats() {
  // Profile status
  const profileStatus = document.getElementById('dash-profile-status');
  if (currentProfile && currentProfile.full_name) {
    profileStatus.textContent = currentProfile.full_name;
  } else {
    profileStatus.textContent = 'Not set up';
  }

  // Report count
  const reportCount = document.getElementById('dash-report-count');
  reportCount.textContent = currentReports.length === 1
    ? '1 report'
    : currentReports.length + ' reports';

  // Card status
  const cardStatus = document.getElementById('dash-card-status');
  cardStatus.textContent = (currentProfile && currentProfile.full_name)
    ? 'Ready to print'
    : 'Complete profile first';

  // Greeting name
  const dashName = document.getElementById('dash-name');
  if (currentProfile && currentProfile.full_name) {
    dashName.textContent = ', ' + currentProfile.full_name.split(' ')[0];
  } else if (currentUser && currentUser.email) {
    dashName.textContent = '';
  }

  // Avatar initial
  const avatar = document.getElementById('nav-user-avatar');
  if (currentUser && currentUser.email) {
    avatar.textContent = currentUser.email[0].toUpperCase();
  }
}


/* ════════════════════════════════════════════════════════════
   8. UTILITY HELPERS
════════════════════════════════════════════════════════════ */

/*
  showMessage(el, type, text)
  ────────────────────────────
  Sets a form message element to show an error, success, or info message.
  type must be 'error', 'success', or 'info'.
*/
function showMessage(el, type, text) {
  el.textContent = text;
  el.className   = 'form-message ' + type;
}

/*
  clearMessage(el)
  ─────────────────
  Hides a form message element.
*/
function clearMessage(el) {
  el.textContent = '';
  el.className   = 'form-message';
}

/*
  setButtonLoading(btn, loading, text)
  ──────────────────────────────────────
  Disables / re-enables a button and changes its label
  while an async operation is running.
*/
function setButtonLoading(btn, loading, text) {
  btn.disabled    = loading;
  btn.textContent = text;
}

/*
  formatDate(dateStr)
  ────────────────────
  Converts a YYYY-MM-DD string to a human-readable "DD Mon YYYY" format.
  e.g. "2024-03-15" → "15 Mar 2024"
*/
function formatDate(dateStr) {
  if (!dateStr) return '—';
  // Adding T00:00:00 prevents JavaScript from treating the date as UTC
  // and shifting it by your timezone, which would show the wrong day.
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/*
  escHtml(str)
  ─────────────
  Escapes characters that have special meaning in HTML (< > & " ')
  so that user-supplied content cannot be injected as HTML.
  This is a basic XSS prevention measure.
*/
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/*
  showProgressBar(visible)
  ─────────────────────────
  Shows or hides the upload progress bar.
*/
function showProgressBar(visible) {
  const bar = document.getElementById('upload-progress');
  if (visible) {
    bar.classList.remove('hidden');
    // Animate to ~80% to give the feeling of progress
    document.getElementById('upload-bar').style.width = '80%';
  } else {
    document.getElementById('upload-bar').style.width = '0%';
    bar.classList.add('hidden');
  }
}

/*
  clearFileChosen()
  ──────────────────
  Hides the "file chosen" indicator after a successful upload.
*/
function clearFileChosen() {
  const el = document.getElementById('file-chosen');
  if (el) { el.textContent = ''; el.classList.add('hidden'); }
}

/*
  File input → show filename
  ───────────────────────────
  When the user selects a file, show its name below the drop zone.
*/
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('r-file');
  const fileChosen = document.getElementById('file-chosen');

  if (fileInput && fileChosen) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        fileChosen.textContent = '📎 ' + fileInput.files[0].name;
        fileChosen.classList.remove('hidden');
      } else {
        fileChosen.classList.add('hidden');
      }
    });
  }

  // Start the app (check for existing session, show correct screen)
  initApp();
});
