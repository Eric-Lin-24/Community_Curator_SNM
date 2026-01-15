// ============================================
// DASHBOARD VIEW (REAL SYSTEM SUMMARY)
// ============================================

function formatRelativeTime(iso) {
  if (!iso) return 'Never';
  const t = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - t);

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function isOverdueMessage(m) {
  if (!m || !m.scheduled_time) return false;
  if (m.status === 'sent') return false;
  return new Date(m.scheduled_time).getTime() < Date.now();
}

function getNextPendingMessage(messages) {
  const pending = (messages || [])
    .filter(m => m.status !== 'sent' && m.scheduled_time)
    .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));
  return pending[0] || null;
}

function dashboardStatCard({ icon, title, value, meta, tone = 'teal' }) {
  // tones: teal, purple, blue, pink exist in CSS stat-icon presets :contentReference[oaicite:4]{index=4}
  return `
    <div class="card stat-card">
      <div class="stat-icon ${tone}">
        ${icon}
      </div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${title}</div>
      <div class="text-xs text-muted">${meta || ''}</div>
    </div>
  `;
}

function dashboardStatusRow(label, value, statusDot /* success|warning|error|muted */) {
  const color =
    statusDot === 'success' ? 'var(--success)' :
    statusDot === 'warning' ? 'var(--warning)' :
    statusDot === 'error' ? 'var(--error)' :
    'var(--text-muted)';

  return `
    <div class="flex justify-between items-center py-2">
      <span class="text-muted">${label}</span>
      <span class="flex items-center gap-2">
        <span style="color:${color};">●</span>
        <span>${value}</span>
      </span>
    </div>
  `;
}

function renderDashboard() {
  const content = document.getElementById('content');

  const docs = AppState.documents || [];
  const oneDriveDocs = docs.filter(d => (d.source || 'onedrive') === 'onedrive');
  const googleDocs = docs.filter(d => d.source === 'googledrive');

  const pendingMessages = (AppState.scheduledMessages || []).filter(m => m.status !== 'sent');
  const overdue = pendingMessages.filter(isOverdueMessage);
  const nextMsg = getNextPendingMessage(AppState.scheduledMessages || []);

  const totalFormResponses = (AppState.microsoftForms || []).reduce(
    (sum, f) => sum + (f.responseCount || 0),
    0
  );

  const msConnected = !!(AppState.isAuthenticated && AppState.userProfile);
  const gdConnected = !!AppState.googleDriveConnected;
  const vmConfigured = !!(AppState.azureVmUrl && String(AppState.azureVmUrl).trim().length > 0);

  const vmHealthy =
    vmConfigured &&
    !AppState.loadingSubscribedChats &&
    Array.isArray(AppState.subscribedChats);

  content.innerHTML = `
    <div class="animate-in">
      <div class="grid grid-cols-4 gap-6 mb-6">
        ${dashboardStatCard({
          tone: msConnected ? 'teal' : 'blue',
          title: 'Microsoft 365',
          value: msConnected ? 'Connected' : 'Not Connected',
          meta: msConnected ? (AppState.userProfile.name || 'Signed in') : 'Connect in Settings',
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M4 4h7v7H4z"/><path d="M13 4h7v7h-7z"/><path d="M4 13h7v7H4z"/><path d="M13 13h7v7h-7z"/>
                 </svg>`
        })}
        ${dashboardStatCard({
          tone: gdConnected ? 'purple' : 'blue',
          title: 'Google Drive',
          value: gdConnected ? 'Connected' : 'Not Connected',
          meta: gdConnected ? (AppState.googleDriveEmail || 'Authorized') : 'Connect in Settings',
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M7 3h10l4 7-5 11H6L1 10z"/>
                 </svg>`
        })}
        ${dashboardStatCard({
          tone: 'pink',
          title: 'Documents Synced',
          value: (oneDriveDocs.length + googleDocs.length).toString(),
          meta: `OneDrive: ${oneDriveDocs.length} • Drive: ${googleDocs.length}`,
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                   <path d="M14 2v6h6"/>
                 </svg>`
        })}
        ${dashboardStatCard({
          tone: overdue.length > 0 ? 'blue' : 'teal',
          title: 'Pending Messages',
          value: pendingMessages.length.toString(),
          meta: overdue.length > 0 ? `${overdue.length} overdue` : (nextMsg ? `Next: ${new Date(nextMsg.scheduled_time).toLocaleString()}` : 'No upcoming'),
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                 </svg>`
        })}
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h3 class="font-semibold">System Health</h3>
              <p class="text-xs text-muted">Live status pulled from current AppState</p>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm" onclick="refreshCurrentView()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                Refresh
              </button>
              <button class="btn btn-primary btn-sm" onclick="navigateTo('settings')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33H9a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 4.6 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 2.6 15V9A1.65 1.65 0 0 0 1.09 8H1a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 2.6 2.6l.06-.06a2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 7 2.6h6a1.65 1.65 0 0 0 1.51-1H15a2 2 0 0 1 2 2v.09A1.65 1.65 0 0 0 19.4 4.6l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 21.4 9v6z"/>
                </svg>
                Settings
              </button>
            </div>
          </div>

          <div class="divider"></div>

          ${dashboardStatusRow(
            'OneDrive sync',
            formatRelativeTime(AppState.lastSync?.onedrive),
            AppState.lastSync?.onedrive ? 'success' : (msConnected ? 'warning' : 'muted')
          )}
          ${dashboardStatusRow(
            'Google Drive sync',
            formatRelativeTime(AppState.lastSync?.googledrive),
            AppState.lastSync?.googledrive ? 'success' : (gdConnected ? 'warning' : 'muted')
          )}
          ${dashboardStatusRow(
            'Azure VM URL',
            vmConfigured ? AppState.azureVmUrl : 'Not set',
            vmConfigured ? 'success' : 'warning'
          )}
          ${dashboardStatusRow(
            'Subscribed chats',
            vmHealthy ? `${(AppState.subscribedChats || []).length}` : (vmConfigured ? 'Not loaded' : '—'),
            vmHealthy ? 'success' : (vmConfigured ? 'warning' : 'muted')
          )}
          ${dashboardStatusRow(
            'Chats last refreshed',
            formatRelativeTime(AppState.lastSync?.subscribedChats),
            AppState.lastSync?.subscribedChats ? 'success' : (vmConfigured ? 'warning' : 'muted')
          )}
        </div>

        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h3 class="font-semibold">Activity Snapshot</h3>
              <p class="text-xs text-muted">No placeholders — computed from real in-memory state</p>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="navigateTo('documents')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>
              </svg>
              View Docs
            </button>
          </div>

          <div class="divider"></div>

          <div class="flex justify-between py-2">
            <span class="text-muted">Forms</span>
            <span>${(AppState.microsoftForms || []).length}</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-muted">Total form responses</span>
            <span>${totalFormResponses}</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-muted">Pending scheduled messages</span>
            <span>${pendingMessages.length}</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-muted">Overdue scheduled messages</span>
            <span>${overdue.length}</span>
          </div>

          <div class="divider"></div>

          <div class="flex gap-2">
            <button class="btn btn-primary w-full" onclick="navigateTo('scheduling')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Go to Messages
            </button>
            <button class="btn btn-secondary w-full" onclick="navigateTo('forms')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              Go to Forms
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Export
if (typeof window !== 'undefined') {
  window.renderDashboard = renderDashboard;
}
