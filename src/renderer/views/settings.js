// ============================================
// SETTINGS VIEW
// ============================================

/**
 * Render the settings view
 * Shows application settings and integrations
 */
function renderSettings() {
  const content = document.getElementById('content');

  const user = AppState.userProfile;
  const whatsappConnected = AppState.whatsappConnected || false;
  const whatsappPhone = AppState.whatsappPhone || '';

  content.innerHTML = `
    <div class="space-y-6">
      <div>
        <h3 class="text-2xl font-bold text-gray-800">Settings</h3>
        <p class="text-gray-600">Manage your application preferences</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Settings -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Microsoft 365 Integration -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Microsoft 365 Integration</h3>
            ${AppState.isAuthenticated ? `
              <div class="flex items-center gap-4 mb-4">
                <div class="p-3 bg-blue-50 rounded-full">
                  <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-800">${user.name}</p>
                  <p class="text-sm text-gray-600">${user.email}</p>
                </div>
              </div>
              <div class="flex items-center gap-2 text-sm text-green-600 mb-4">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Connected to Microsoft 365</span>
              </div>
              <button
                onclick="signOut()"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            ` : `
              <p class="text-gray-600 mb-4">Connect to Microsoft 365 to sync SharePoint documents, access Microsoft Forms, and more.</p>
              <button
                onclick="MicrosoftGraphAPI.authenticateWithMicrosoft()"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign in with Microsoft
              </button>
            `}
          </div>

          <!-- WhatsApp Integration -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">WhatsApp Integration</h3>
            ${whatsappConnected ? `
              <div class="flex items-center gap-4 mb-4">
                <div class="p-3 bg-green-50 rounded-full">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-800">WhatsApp Business</p>
                  <p class="text-sm text-gray-600">${whatsappPhone}</p>
                </div>
              </div>
              <div class="flex items-center gap-2 text-sm text-green-600 mb-4">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Connected to WhatsApp</span>
              </div>
              <button
                onclick="disconnectWhatsApp()"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Disconnect WhatsApp
              </button>
            ` : `
              <p class="text-gray-600 mb-4">Connect your WhatsApp Business account to schedule and send messages to your community.</p>
              <button
                onclick="connectWhatsApp()"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Connect WhatsApp
              </button>
            `}
          </div>

          <!-- Google Drive Integration -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Google Drive Integration</h3>
            ${AppState.googleDriveConnected ? `
              <div class="flex items-center gap-4 mb-4">
                <div class="p-3 bg-red-50 rounded-full">
                  <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-800">Google Drive</p>
                  <p class="text-sm text-gray-600">${AppState.googleDriveEmail}</p>
                </div>
              </div>
              <div class="flex items-center gap-2 text-sm text-green-600 mb-4">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Connected to Google Drive</span>
              </div>
              <button
                onclick="disconnectGoogleDrive()"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Disconnect Google Drive
              </button>
            ` : `
              <p class="text-gray-600 mb-4">Connect your Google Drive account to access and manage your files from Google Drive.</p>
              <button
                onclick="GoogleDriveAPI.authenticateWithGoogle()"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Connect Google Drive
              </button>
            `}
          </div>

          <!-- Application Settings -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Application Settings</h3>
            <div class="space-y-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <select
                  id="theme-selector"
                  onchange="handleThemeChange(event)"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-medium text-gray-700">Notifications</label>
                  <p class="text-xs text-gray-500">Enable desktop notifications</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-medium text-gray-700">Auto Sync</label>
                  <p class="text-xs text-gray-500">Automatically sync with Microsoft 365</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <button
                onclick="saveSettings()"
                class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
              >
                Save All Settings
              </button>
            </div>
          </div>
        </div>

        <!-- Info Sidebar -->
        <div class="space-y-6">
          <!-- Connection Status -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Connection Status</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Microsoft 365</span>
                <span class="flex items-center gap-1 text-xs ${AppState.isAuthenticated ? 'text-green-600' : 'text-gray-400'}">
                  <div class="w-2 h-2 rounded-full ${AppState.isAuthenticated ? 'bg-green-600' : 'bg-gray-400'}"></div>
                  ${AppState.isAuthenticated ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">WhatsApp</span>
                <span class="flex items-center gap-1 text-xs ${whatsappConnected ? 'text-green-600' : 'text-gray-400'}">
                  <div class="w-2 h-2 rounded-full ${whatsappConnected ? 'bg-green-600' : 'bg-gray-400'}"></div>
                  ${whatsappConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Google Drive</span>
                <span class="flex items-center gap-1 text-xs ${AppState.googleDriveConnected ? 'text-green-600' : 'text-gray-400'}">
                  <div class="w-2 h-2 rounded-full ${AppState.googleDriveConnected ? 'bg-green-600' : 'bg-gray-400'}"></div>
                  ${AppState.googleDriveConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          <!-- App Info -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Application Info</h3>
            <div class="space-y-3 text-sm">
              <div>
                <p class="text-gray-600">Version</p>
                <p class="font-medium text-gray-800">1.0.0</p>
              </div>
              <div>
                <p class="text-gray-600">Last Updated</p>
                <p class="font-medium text-gray-800">November 2024</p>
              </div>
            </div>
          </div>

          <!-- Statistics -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Statistics</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Documents</span>
                <span class="font-medium text-gray-800">${AppState.documents.length}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Forms</span>
                <span class="font-medium text-gray-800">${AppState.microsoftForms.length}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Scheduled Messages</span>
                <span class="font-medium text-gray-800">${AppState.scheduledMessages.length}</span>
              </div>
            </div>
          </div>

          <!-- Help & Support -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Help & Support</h3>
            <div class="space-y-2 text-sm">
              <a href="#" class="block text-blue-600 hover:text-blue-700">Documentation</a>
              <a href="#" class="block text-blue-600 hover:text-blue-700">Report an Issue</a>
              <a href="#" class="block text-blue-600 hover:text-blue-700">Contact Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Set the theme selector to the saved theme
  setTimeout(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
      themeSelector.value = savedTheme;
    }
  }, 0);
}

/**
 * Connect WhatsApp Business account
 */
function connectWhatsApp() {
  // Show WhatsApp connection modal
  const modalHtml = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target === this) closeWhatsAppModal()">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 mx-4">
        <h3 class="text-xl font-semibold mb-4">Connect WhatsApp Business</h3>
        <p class="text-sm text-gray-600 mb-4">Enter your WhatsApp Business phone number to connect.</p>
        <form onsubmit="submitWhatsAppConnection(event)">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              id="whatsapp-phone"
              required
              placeholder="+1234567890"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p class="text-xs text-gray-500 mt-1">Include country code (e.g., +1 for US)</p>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">API Key (Optional)</label>
            <input
              type="text"
              id="whatsapp-api-key"
              placeholder="Enter your WhatsApp Business API key"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              onclick="closeWhatsAppModal()"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const modalContainer = document.createElement('div');
  modalContainer.id = 'whatsapp-modal';
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);
}

/**
 * Close WhatsApp connection modal
 */
function closeWhatsAppModal() {
  const modal = document.getElementById('whatsapp-modal');
  if (modal) {
    modal.remove();
  }
}

/**
 * Submit WhatsApp connection form
 * @param {Event} event - Form submit event
 */
function submitWhatsAppConnection(event) {
  event.preventDefault();

  const phone = document.getElementById('whatsapp-phone').value;
  const apiKey = document.getElementById('whatsapp-api-key').value;

  // Save WhatsApp connection (simulated)
  AppState.whatsappConnected = true;
  AppState.whatsappPhone = phone;
  AppState.whatsappApiKey = apiKey;

  closeWhatsAppModal();
  renderSettings();

  alert('WhatsApp connected successfully!');
}

/**
 * Disconnect WhatsApp Business account
 */
function disconnectWhatsApp() {
  if (confirm('Are you sure you want to disconnect WhatsApp?')) {
    AppState.whatsappConnected = false;
    AppState.whatsappPhone = '';
    AppState.whatsappApiKey = '';
    renderSettings();
  }
}

/**
 * Disconnect Google Drive account
 */
function disconnectGoogleDrive() {
  if (confirm('Are you sure you want to disconnect Google Drive?')) {
    GoogleDriveAPI.logout();
    renderSettings();
  }
}

/**
 * Sign out from Microsoft 365
 */
function signOut() {
  if (confirm('Are you sure you want to sign out?')) {
    AppState.isAuthenticated = false;
    AppState.userProfile = null;
    AppState.accessToken = null;
    AppState.microsoftForms = [];
    AppState.documents = [];
    renderApp();
  }
}

/**
 * Save application settings
 */
function saveSettings() {
  // Get the Azure VM URL from the input
  const azureVmUrlInput = document.getElementById('azure-vm-url-input');

  if (azureVmUrlInput) {
    const newUrl = azureVmUrlInput.value.trim();

    // Validate URL format
    if (newUrl && !newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      showNotification('Please enter a valid URL starting with http:// or https://', 'error');
      return;
    }

    // Save to AppState and localStorage
    AppState.azureVmUrl = newUrl;
    localStorage.setItem('azureVmUrl', newUrl);

    showNotification('Settings saved successfully!', 'success');

    // If URL was added/changed, try to fetch subscribed chats
    if (newUrl) {
      AzureVMAPI.refreshSubscribedChats();
    }

    // Re-render settings to show updated connection status
    renderSettings();
  } else {
    showNotification('Settings saved!', 'success');
  }
}

// Debounce timer for Azure VM URL auto-save
let azureVmUrlDebounceTimer = null;

/**
 * Handle Azure VM URL changes with auto-save
 */
function handleAzureVmUrlChange() {
  const input = document.getElementById('azure-vm-url-input');
  if (!input) return;

  const url = input.value.trim();

  // Clear existing timer
  if (azureVmUrlDebounceTimer) {
    clearTimeout(azureVmUrlDebounceTimer);
  }

  // Update status
  updateAzureVmUrlStatus('typing');

  // Debounce for 1 second
  azureVmUrlDebounceTimer = setTimeout(() => {
    autoSaveAzureVmUrl(url);
  }, 1000);
}

/**
 * Handle paste event for immediate connection
 * @param {Event} event - Paste event
 */
function handleAzureVmUrlPaste(event) {
  // Let the paste happen first
  setTimeout(() => {
    const input = document.getElementById('azure-vm-url-input');
    if (!input) return;

    const url = input.value.trim();

    // Clear any existing timer
    if (azureVmUrlDebounceTimer) {
      clearTimeout(azureVmUrlDebounceTimer);
    }

    // Immediately save and connect on paste
    updateAzureVmUrlStatus('saving');
    autoSaveAzureVmUrl(url);
  }, 10);
}

/**
 * Auto-save Azure VM URL and attempt connection
 * @param {string} url - Azure VM URL
 */
async function autoSaveAzureVmUrl(url) {
  updateAzureVmUrlStatus('saving');

  // Validate URL format
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    updateAzureVmUrlStatus('error', 'Invalid URL format - must start with http:// or https://');
    showNotification('Invalid URL format', 'error');
    return;
  }

  // Save to AppState and localStorage
  const previousUrl = AppState.azureVmUrl;
  AppState.azureVmUrl = url;
  localStorage.setItem('azureVmUrl', url);

  // If URL is empty, just clear and return
  if (!url) {
    AppState.subscribedChats = [];
    updateAzureVmUrlStatus('cleared', 'URL cleared');
    showNotification('Azure VM URL cleared', 'info');

    // Update connection status in other views
    if (AppState.currentView === 'scheduling') {
      renderScheduling();
    }
    return;
  }

  // If URL changed, try to connect
  if (url !== previousUrl) {
    updateAzureVmUrlStatus('connecting');

    try {
      const chats = await AzureVMAPI.fetchSubscribedChats();
      updateAzureVmUrlStatus('success', `Connected! Loaded ${chats.length} chat(s)`);
      showNotification(`✓ Connected to Azure VM - ${chats.length} chat(s) loaded`, 'success');

      // Update connection status in other views
      if (AppState.currentView === 'scheduling') {
        renderScheduling();
      }
    } catch (error) {
      updateAzureVmUrlStatus('error', 'Connection failed: ' + error.message);
      showNotification('Failed to connect: ' + error.message, 'error');
      console.error('Azure VM connection error:', error);
    }
  } else {
    updateAzureVmUrlStatus('saved', 'Saved');
  }
}

/**
 * Update Azure VM URL status indicator
 * @param {string} status - Status type (typing, saving, connecting, success, error, cleared, saved)
 * @param {string} message - Optional status message
 */
function updateAzureVmUrlStatus(status, message = '') {
  const statusElement = document.getElementById('azure-vm-connection-status');
  const hintElement = document.getElementById('azure-vm-url-hint');
  const loadingElement = document.getElementById('azure-vm-url-loading');
  const inputElement = document.getElementById('azure-vm-url-input');

  if (!statusElement || !hintElement || !loadingElement || !inputElement) return;

  // Hide/show loading spinner
  if (status === 'saving' || status === 'connecting') {
    loadingElement.classList.remove('hidden');
  } else {
    loadingElement.classList.add('hidden');
  }

  // Update border color
  inputElement.classList.remove('border-green-500', 'border-red-500', 'border-yellow-500', 'border-gray-300');

  switch (status) {
    case 'typing':
      statusElement.textContent = '';
      statusElement.className = 'ml-2 text-xs';
      hintElement.innerHTML = '<span class="text-blue-600 font-medium">💡 Just paste your URL</span> - will auto-save in 1 second...';
      hintElement.className = 'text-xs mt-1';
      inputElement.classList.add('border-gray-300');
      break;

    case 'saving':
      statusElement.textContent = '⏳ Saving...';
      statusElement.className = 'ml-2 text-xs text-yellow-600';
      hintElement.innerHTML = 'Saving URL...';
      hintElement.className = 'text-xs text-yellow-600 mt-1';
      inputElement.classList.add('border-yellow-500');
      break;

    case 'connecting':
      statusElement.textContent = '🔄 Connecting...';
      statusElement.className = 'ml-2 text-xs text-blue-600';
      hintElement.innerHTML = 'Connecting to Azure VM...';
      hintElement.className = 'text-xs text-blue-600 mt-1';
      inputElement.classList.add('border-yellow-500');
      break;

    case 'success':
      statusElement.textContent = '✓ Connected';
      statusElement.className = 'ml-2 text-xs text-green-600 font-medium';
      hintElement.innerHTML = message || 'Connected successfully!';
      hintElement.className = 'text-xs text-green-600 mt-1';
      inputElement.classList.add('border-green-500');
      break;

    case 'error':
      statusElement.textContent = '✗ Error';
      statusElement.className = 'ml-2 text-xs text-red-600 font-medium';
      hintElement.innerHTML = message || 'Connection failed';
      hintElement.className = 'text-xs text-red-600 mt-1';
      inputElement.classList.add('border-red-500');
      break;

    case 'cleared':
      statusElement.textContent = '';
      statusElement.className = 'ml-2 text-xs';
      hintElement.innerHTML = '<span class="text-blue-600 font-medium">💡 Just paste your URL</span> - it will auto-save and connect immediately';
      hintElement.className = 'text-xs mt-1';
      inputElement.classList.add('border-gray-300');
      break;

    case 'saved':
      statusElement.textContent = '✓ Saved';
      statusElement.className = 'ml-2 text-xs text-green-600';
      hintElement.innerHTML = 'URL saved';
      hintElement.className = 'text-xs text-green-600 mt-1';
      inputElement.classList.add('border-green-500');
      break;
  }
}

/**
 * Test Azure VM connection manually
 */
async function testAzureVmConnection() {
  if (!AppState.azureVmUrl) {
    showNotification('Please enter an Azure VM URL first', 'warning');
    return;
  }

  updateAzureVmUrlStatus('connecting');
  showNotification('Testing connection to Azure VM...', 'info');

  try {
    const chats = await AzureVMAPI.fetchSubscribedChats();
    updateAzureVmUrlStatus('success', `✓ Connected! Loaded ${chats.length} chat(s)`);
    showNotification(`✓ Connection successful! Found ${chats.length} subscribed chat(s)`, 'success');

    // Re-render settings to update stats
    renderSettings();
  } catch (error) {
    updateAzureVmUrlStatus('error', error.message);
    showNotification('Connection failed: ' + error.message, 'error');
    console.error('Test connection error:', error);
  }
}
