// ============================================
// SETTINGS VIEW
// ============================================

function renderSettings() {
  const content = document.getElementById('content');

  content.innerHTML = `
    <div class="animate-slide-up">
      <!-- User Account Section -->
      ${AppState.username ? `
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">Your Account</h3>
        <div class="connection-card">
          <div class="connection-icon" style="background: var(--accent-primary-soft); color: var(--accent-primary);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="connection-info flex-1">
            <div class="connection-name">${AppState.username}</div>
            <div class="connection-status">
              <span class="badge badge-success">Signed In</span>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="handleLogout()">Logout</button>
        </div>
      </div>
      ` : ''}

      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">Connected Accounts</h3>
        <div class="grid grid-cols-2 gap-4">
          
          <div class="connection-card">
            <div class="connection-icon microsoft"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg></div>
            <div class="connection-info flex-1">
              <div class="connection-name">Microsoft 365</div>
              <div class="connection-status">
                ${AppState.isAuthenticated 
                  ? `<span class="badge badge-success">Connected</span> ${AppState.userProfile?.email || ''}`
                  : '<span class="badge badge-error">Not connected</span>'}
              </div>
            </div>
            ${AppState.isAuthenticated 
              ? `<button class="btn btn-ghost btn-sm" onclick="MicrosoftGraphAPI.logout()">Disconnect</button>`
              : `<button class="btn btn-primary btn-sm" onclick="MicrosoftGraphAPI.authenticateWithMicrosoft()">Connect</button>`}
          </div>

          <div class="connection-card">
            <div class="connection-icon google"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 22 22 22 12 2"/></svg></div>
            <div class="connection-info flex-1">
              <div class="connection-name">Google Drive</div>
              <div class="connection-status">
                ${AppState.googleDriveConnected 
                  ? `<span class="badge badge-success">Connected</span> ${AppState.googleDriveEmail || ''}`
                  : '<span class="badge badge-error">Not connected</span>'}
              </div>
            </div>
            ${AppState.googleDriveConnected 
              ? `<button class="btn btn-ghost btn-sm" onclick="GoogleDriveAPI.logout()">Disconnect</button>`
              : `<button class="btn btn-primary btn-sm" onclick="GoogleDriveAPI.authenticateWithGoogle()">Connect</button>`}
          </div>

          <div class="connection-card">
            <div class="connection-icon whatsapp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div>
            <div class="connection-info flex-1">
              <div class="connection-name">WhatsApp (Azure VM)</div>
              <div class="connection-status">
                ${AppState.subscribedChats.length > 0 
                  ? `<span class="badge badge-success">Connected</span> ${AppState.subscribedChats.length} chats`
                  : '<span class="badge badge-warning">Checking...</span>'}
              </div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="AzureVMAPI.refreshSubscribedChats()">Refresh</button>
          </div>
        </div>
      </div>

      <div class="card mb-6">
        <h3 class="font-semibold mb-4">Azure VM Configuration</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">API Endpoint URL</label>
            <input type="text" id="azure-vm-url" value="${AppState.azureVmUrl || ''}" placeholder="http://your-vm-ip:8000">
          </div>
          <div class="form-group flex items-end">
            <button class="btn btn-secondary" onclick="saveAzureVmUrl()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Save
            </button>
            <button class="btn btn-ghost ml-2" onclick="testAzureConnection()">Test Connection</button>
          </div>
        </div>
      </div>

      <div class="card mb-6">
        <h3 class="font-semibold mb-4">Appearance</h3>
        <div class="form-group" style="max-width: 300px;">
          <label class="form-label">Theme</label>
          <select id="theme-select" onchange="handleThemeChange(event)">
            <option value="dark" ${localStorage.getItem('theme') === 'dark' ? 'selected' : ''}>Dark</option>
            <option value="light" ${localStorage.getItem('theme') === 'light' ? 'selected' : ''}>Light</option>
            <option value="auto" ${localStorage.getItem('theme') === 'auto' ? 'selected' : ''}>System</option>
          </select>
        </div>
      </div>

      <div class="card">
        <h3 class="font-semibold mb-4">About</h3>
        <div class="flex flex-col gap-3">
          <div class="flex justify-between"><span class="text-muted">Application</span><span>Community Curator</span></div>
          <div class="flex justify-between"><span class="text-muted">Version</span><span>1.0.0</span></div>
          <div class="flex justify-between"><span class="text-muted">Platform</span><span>Electron</span></div>
        </div>
        <div class="divider"></div>
        <p class="text-sm text-muted">Community Curator helps you manage documents, schedule messages, and collect feedback.</p>
      </div>
    </div>
  `;
}

function saveAzureVmUrl() {
  const url = document.getElementById('azure-vm-url').value.trim();
  if (!url) { showNotification('Please enter a valid URL', 'warning'); return; }
  try { new URL(url); } catch (e) { showNotification('Please enter a valid URL format', 'error'); return; }
  AppState.azureVmUrl = url;
  localStorage.setItem('azureVmUrl', url);
  showNotification('Azure VM URL saved', 'success');
}

async function testAzureConnection() {
  if (!AppState.azureVmUrl) { showNotification('Please enter and save the Azure VM URL first', 'warning'); return; }
  showNotification('Testing connection...', 'info');
  try {
    await AzureVMAPI.fetchSubscribedChats();
    showNotification(`Connection successful! Found ${AppState.subscribedChats.length} chats.`, 'success');
    renderSettings();
  } catch (error) {
    showNotification('Connection failed: ' + error.message, 'error');
  }
}

function updateUserCard() {
  const avatar = document.getElementById('user-avatar');
  const name = document.getElementById('user-name');
  const status = document.getElementById('user-status');

  // Check if user is logged in with custom auth
  if (AppState.username && AppState.userId) {
    const initials = AppState.username.substring(0, 2).toUpperCase();
    if (avatar) avatar.textContent = initials;
    if (name) name.textContent = AppState.username;
    if (status) status.innerHTML = '<span style="color: var(--success);">● Signed In</span>';
  }
  // Check if connected to Microsoft
  else if (AppState.isAuthenticated && AppState.userProfile) {
    const initials = AppState.userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (avatar) avatar.textContent = initials;
    if (name) name.textContent = AppState.userProfile.name;
    if (status) status.innerHTML = '<span style="color: var(--success);">● Connected</span>';
  } else {
    if (avatar) avatar.textContent = '?';
    if (name) name.textContent = 'Not Connected';
    if (status) status.innerHTML = '<span>Click to connect</span>';
  }
}

if (typeof window !== 'undefined') {
  window.renderSettings = renderSettings;
  window.saveAzureVmUrl = saveAzureVmUrl;
  window.testAzureConnection = testAzureConnection;
  window.updateUserCard = updateUserCard;
}