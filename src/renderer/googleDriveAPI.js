// ============================================
// GOOGLE DRIVE API
// ============================================
// This module provides Google Drive API integration for file management.
// It requires AppState and utility functions (showNotification, renderApp) to be defined globally.

const GoogleDriveAPI = {
  async authenticateWithGoogle() {
    try {
      console.log('Starting Google Drive authentication...');
      const result = await window.electronAPI.googleLogin();

      if (result.success) {
        console.log('Google authentication window opened, waiting for response...');
        showNotification('Google authentication in progress...', 'info');
      }
    } catch (error) {
      console.error('Google Drive login error:', error);
      showNotification('Google login failed: ' + error.message, 'error');
    }
  },

  async checkAuthentication() {
    try {
      // Check if user is logged in to the app first
      if (!AppState.userId) {
        AppState.googleDriveConnected = false;
        AppState.googleDriveEmail = '';
        return false;
      }

      // Load user-specific Google auth from localStorage
      const userGoogleEmailKey = `google_email_${AppState.userId}`;
      const userGoogleTokenKey = `google_token_${AppState.userId}`;

      const savedEmail = localStorage.getItem(userGoogleEmailKey);
      const savedTokenInfo = localStorage.getItem(userGoogleTokenKey);

      // Don't trust saved auth - always verify with fresh token from main process
      // This ensures we have valid, up-to-date credentials

      // Get user info
      const userInfo = await window.electronAPI.getGoogleUserInfo();

      if (!userInfo) {
        // Clear any stale saved data
        if (savedEmail || savedTokenInfo) {
          console.log('Clearing stale Google auth data for user:', AppState.userId);
          localStorage.removeItem(userGoogleEmailKey);
          localStorage.removeItem(userGoogleTokenKey);
        }
        AppState.googleDriveConnected = false;
        AppState.googleDriveEmail = '';
        return false;
      }

      // CRITICAL: Also verify we have a valid access token
      const tokenInfo = await window.electronAPI.getGoogleAccessToken();

      if (!tokenInfo) {
        console.warn('User info exists but no access token - session may have expired');

        // Clear saved data since it's invalid
        localStorage.removeItem(userGoogleEmailKey);
        localStorage.removeItem(userGoogleTokenKey);

        AppState.googleDriveConnected = false;
        AppState.googleDriveEmail = '';

        showNotification('Google Drive session expired. Please reconnect in Settings.', 'warning');
        return false;
      }

      // Both user info AND valid token exist
      AppState.googleDriveConnected = true;
      AppState.googleDriveEmail = userInfo.email;

      // Save to user-specific storage only after verifying it works
      localStorage.setItem(userGoogleEmailKey, userInfo.email);
      localStorage.setItem(userGoogleTokenKey, JSON.stringify(tokenInfo));

      console.log('✓ Google Drive authenticated for user:', AppState.userId);
      return true;
    } catch (error) {
      console.error('Google auth check error:', error);

      // Clear any saved auth data on error
      if (AppState.userId) {
        localStorage.removeItem(`google_email_${AppState.userId}`);
        localStorage.removeItem(`google_token_${AppState.userId}`);
      }

      AppState.googleDriveConnected = false;
      AppState.googleDriveEmail = '';
      return false;
    }
  },

  async logout() {
    try {
      await window.electronAPI.googleLogout();

      // Clear user-specific Google auth
      if (AppState.userId) {
        localStorage.removeItem(`google_email_${AppState.userId}`);
        localStorage.removeItem(`google_token_${AppState.userId}`);
      }

      AppState.googleDriveConnected = false;
      AppState.googleDriveEmail = '';

      // If active source is Google Drive, switch to OneDrive or clear documents
      if (AppState.activeDocumentSource === 'googledrive') {
        AppState.activeDocumentSource = 'onedrive';
        AppState.documents = AppState.documents.filter(d => d.source !== 'googledrive');
      }

      showNotification('Disconnected from Google Drive', 'success');
      renderApp();
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Logout failed', 'error');
    }
  },

  async getGoogleDriveFiles() {
    if (!AppState.googleDriveConnected) {
      console.log('Not authenticated with Google Drive');
      return [];
    }

    try {
      showNotification('Loading Google Drive files...', 'info');

      const files = await window.electronAPI.getGoogleDriveFiles();

      // Transform Google Drive files to match our app format
      return files.map(file => ({
        id: file.id,
        title: file.name,
        content: file.name,
        source: 'googledrive',
        created_at: file.createdTime,
        updated_at: file.modifiedTime,
        webUrl: file.webViewLink,
        size: file.size || 0,
        mimeType: file.mimeType,
        iconLink: file.iconLink
      }));
    } catch (error) {
      console.error('Error fetching Google Drive files:', error);
      showNotification('Failed to fetch Google Drive files: ' + error.message, 'error');
      return [];
    }
  }
};
