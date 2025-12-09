// Community Curator - Main Application Entry Point (Refactored)
// This file orchestrates the initialization and event listeners

// ============================================
// INITIALIZATION
// ============================================

// Listen for authentication events from main process
window.electronAPI.onAuthSuccess(() => {
  console.log('Authentication successful - checking status');
  MicrosoftGraphAPI.checkAuthentication();
});

window.electronAPI.onAuthError((error) => {
  console.error('Authentication error:', error);
  showNotification('Authentication failed: ' + error, 'error');
});

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

// ============================================
// APP STARTUP
// ============================================

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Community Curator starting...');

  // Initialize theme
  initializeTheme();

  // Check authentication status
  await MicrosoftGraphAPI.checkAuthentication();
  await GoogleDriveAPI.checkAuthentication();

  // Initialize subscribed chats from Azure VM
  await initializeSubscribedChats();

  // Render the app
  renderApp();

  console.log('Community Curator initialized');
});
