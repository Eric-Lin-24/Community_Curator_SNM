// ============================================
// COMMUNITY CURATOR - Main Application Entry Point
// Orchestrates initialization and event listeners
// ============================================

// ============================================
// AUTHENTICATION EVENT LISTENERS
// ============================================

// Check if electronAPI exists (it won't in browser testing)
if (typeof window.electronAPI !== 'undefined') {
  // Microsoft authentication events
  window.electronAPI.onAuthSuccess(() => {
    console.log('Authentication successful - checking status');
    MicrosoftGraphAPI.checkAuthentication();
  });

  window.electronAPI.onAuthError((error) => {
    console.error('Authentication error:', error);
    showNotification('Authentication failed: ' + error, 'error');
  });

  // Google authentication events
  window.electronAPI.onGoogleAuthSuccess((data) => {
    console.log('Google authentication successful:', data);
    AppState.googleDriveConnected = true;
    AppState.googleDriveEmail = data.email;
    showNotification(`Connected to Google Drive: ${data.email}`, 'success');
    renderApp();
  });

  window.electronAPI.onGoogleAuthError((error) => {
    console.error('Google authentication error:', error);
    showNotification('Google authentication failed: ' + error, 'error');
  });
} else {
  console.warn('electronAPI not available - running in browser mode');
}

// ============================================
// INITIALIZATION HELPERS
// ============================================

/**
 * Initialize subscribed chats from Azure VM
 */
async function initializeSubscribedChats() {
  // Load saved Azure VM URL from localStorage
  const savedUrl = localStorage.getItem('azureVmUrl');
  if (savedUrl) {
    AppState.azureVmUrl = savedUrl;
  }

  try {
    await AzureVMAPI.fetchSubscribedChats();
    console.log(`Loaded ${AppState.subscribedChats.length} subscribed chats`);
  } catch (error) {
    console.warn('Could not fetch subscribed chats:', error.message);
  }
}

/**
 * Load Microsoft Forms
 */
async function loadForms() {
  if (AppState.isAuthenticated) {
    try {
      AppState.microsoftForms = await MicrosoftGraphAPI.getForms();
    } catch (error) {
      console.error('Error loading forms:', error);
    }
  }
}

// ============================================
// MODAL FUNCTIONS
// ============================================

/**
 * Close the modal
 */
function closeModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }
}

/**
 * Show a modal
 * @param {string} type - Modal type
 */
function showModal(type) {
  switch (type) {
    case 'newMessage':
      navigateTo('scheduleMessage');
      return;
    default:
      console.warn('Unknown modal type:', type);
      return;
  }
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') {
    closeModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// ============================================
// APP STARTUP
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Community Curator starting...');

  // Initialize theme
  if (typeof initializeTheme === 'function') {
    initializeTheme();
  }

  // Check authentication status (only if electronAPI exists)
  if (typeof window.electronAPI !== 'undefined') {
    try {
      await MicrosoftGraphAPI.checkAuthentication();
      await GoogleDriveAPI.checkAuthentication();
    } catch (e) {
      console.warn('Auth check failed:', e);
    }
  }

  // Initialize subscribed chats from Azure VM
  await initializeSubscribedChats();

  // Load forms if authenticated
  await loadForms();

  // Render the app
  renderApp();

  console.log('Community Curator initialized');
});

// Export to global scope
if (typeof window !== 'undefined') {
  window.closeModal = closeModal;
  window.showModal = showModal;
  window.initializeSubscribedChats = initializeSubscribedChats;
}