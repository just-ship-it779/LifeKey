/*
  public-record.js — Public QR record page
  ───────────────────────────────────────────────────────────────
  PURPOSE: This is the page someone sees when they scan the QR
  code on a LifeKey medical card. It does NOT require login.

  HOW IT WORKS:
  1. Read the ?user=<id> value from the page URL
  2. Query the `profiles` table for that user_id  (public RLS policy allows this)
  3. Query the `medical_records` table for that user_id
  4. Build and show the HTML

  The public RLS policies we set up in Phase 2 allow the anon key
  to SELECT from both tables, which is why this works without login.
  ───────────────────────────────────────────────────────────────
*/

'use strict';

/* ── Utility: format YYYY-MM-DD → "15 Mar 2024" ─────────────── */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Utility: escape HTML to prevent XSS ────────────────────── */
function escHtml(str) {
  if (str == null || str === '') return '—';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── Show an error message in the content area ───────────────── */
function showError(message) {
  document.getElementById('pub-content').innerHTML = `
    <div class="pub-error">
      <p><strong>Could not load record.</strong></p>
      <p>${escHtml(message)}</p>
    </div>
  `;
}

/* ── Show a loading spinner ──────────────────────────────────── */
function showLoading() {
  document.getElementById('pub-content').innerHTML = `
    <div class="pub-loading">
      <p>Loading medical record…</p>
    </div>
  `;
}

/*
  renderPublicRecord(profile, reports)
  ─────────────────────────────────────
  Builds the full HTML for the public record page and injects it.
  Called after both the profile and reports have been fetched.
*/
function renderPublicRecord(profile, reports) {

  /* ── Profile card ── */
  const dobLine = profile.date_of_birth ? `
    <div class="pub-field">
      <label>Date of Birth</label>
      <p>${escHtml(formatDate(profile.date_of_birth))}</p>
    </div>` : '';

  const conditionsLine = `
    <div class="pub-field">
      <label>Medical Conditions</label>
      <p>${escHtml(profile.conditions || 'None')}</p>
    </div>`;

  const medicationsLine = `
    <div class="pub-field">
      <label>Current Medications</label>
      <p>${escHtml(profile.medications || 'None')}</p>
    </div>`;

  const notesLine = profile.notes ? `
    <div class="pub-field pub-field-full">
      <label>Additional Notes</label>
      <p>${escHtml(profile.notes)}</p>
    </div>` : '';

  const emergencyLine = (profile.emergency_name || profile.emergency_phone) ? `
    <div class="pub-field">
      <label>Emergency Contact</label>
      <p>
        ${escHtml(profile.emergency_name || '')}
        ${profile.emergency_name && profile.emergency_phone ? '<br>' : ''}
        ${escHtml(profile.emergency_phone || '')}
      </p>
    </div>` : '';

  /* ── Reports list ── */
  let reportsHtml = '';
  if (!reports || reports.length === 0) {
    reportsHtml = `<p class="pub-no-reports">No reports uploaded for this record.</p>`;
  } else {
    reportsHtml = reports.map(r => {
      // Determine file type label from the stored file_type string
      const ext = (r.file_type || '')
        .replace('application/', '')
        .replace('image/', '')
        .toUpperCase();

      return `
        <div class="pub-report-item">
          <div class="pub-report-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="pub-report-info">
            <div class="pub-report-type">${escHtml(r.report_type)}</div>
            <div class="pub-report-meta">
              ${escHtml(formatDate(r.report_date))} &nbsp;·&nbsp; ${escHtml(r.hospital)}
            </div>
          </div>
          <a href="${escHtml(r.file_url)}" target="_blank" rel="noopener noreferrer"
             class="btn btn-outline btn-sm">
            View
          </a>
        </div>
      `;
    }).join('');
  }

  /* ── Inject everything into the page ── */
  document.getElementById('pub-content').innerHTML = `
    <div class="pub-profile-card">
      <h2 class="pub-name">${escHtml(profile.full_name)}</h2>
      <span class="pub-blood">${escHtml(profile.blood_group || 'Unknown')}</span>

      <div class="pub-fields">
        ${dobLine}
        <div class="pub-field">
          <label>Allergies</label>
          <p>${escHtml(profile.allergies || 'None known')}</p>
        </div>
        ${conditionsLine}
        ${medicationsLine}
        ${emergencyLine}
        ${notesLine}
      </div>
    </div>

    <h2 class="pub-section-heading">
      Uploaded Reports
      <span class="pub-report-count">${reports.length}</span>
    </h2>
    ${reportsHtml}
  `;
}

/*
  loadPublicRecord()
  ───────────────────
  Main entry point. Reads user ID from URL, fetches data,
  calls renderPublicRecord().
*/
async function loadPublicRecord() {
  showLoading();

  /* Step 1 — read the user ID from the URL query string */
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('user');

  if (!userId) {
    showError('No user ID in the URL. Please scan the QR code on the medical card.');
    return;
  }

  /* Step 2 — fetch the profile */
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    showError(
      'No public record found for this ID. ' +
      'Make sure the profile has been saved at least once.'
    );
    return;
  }

  /* Step 3 — fetch the reports, sorted newest first */
  const { data: records, error: recordsError } = await supabaseClient
    .from('medical_records')
    .select('*')
    .eq('user_id', userId)
    .order('report_date', { ascending: false });

  if (recordsError) {
    console.error('Error loading reports:', recordsError.message);
    // Non-fatal — show the profile anyway, just with no reports
  }

  /*
    Step 4 — for each report row, build a public file URL.
    Files are stored in the "reports" bucket which is public,
    so we can get a permanent URL using getPublicUrl().
  */
  const reports = (records || []).map(r => {
    const { data: urlData } = supabaseClient
      .storage
      .from('reports')
      .getPublicUrl(r.file_path);

    return {
      ...r,
      file_url: urlData.publicUrl,
    };
  });

  /* Step 5 — render everything */
  renderPublicRecord(profile, reports);
}

/* ── Update the page <title> with the person's name once loaded ── */
document.addEventListener('DOMContentLoaded', () => {
  loadPublicRecord().then(() => {
    // Try to update the browser tab title after render
    const nameEl = document.querySelector('.pub-name');
    if (nameEl && nameEl.textContent) {
      document.title = nameEl.textContent + ' — LifeKey Record';
    }
  });
});
