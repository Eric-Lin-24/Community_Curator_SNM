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

      if (savedEmail && savedTokenInfo) {
        AppState.googleDriveConnected = true;
        AppState.googleDriveEmail = savedEmail;
        console.log('✓ Restored Google Drive auth for user:', AppState.userId);
        return true;
      }

      // Get user info
      const userInfo = await window.electronAPI.getGoogleUserInfo();

      if (!userInfo) {
        AppState.googleDriveConnected = false;
        AppState.googleDriveEmail = '';
        return false;
      }

      // CRITICAL: Also verify we have a valid access token
      const tokenInfo = await window.electronAPI.getGoogleAccessToken();

      if (!tokenInfo) {
        console.warn('User info exists but no access token - session may have expired');
        AppState.googleDriveConnected = false;
        AppState.googleDriveEmail = '';

        // Try to refresh the token by calling getGoogleAccessToken again
        try {
          const refreshedToken = await window.electronAPI.getGoogleAccessToken();
          if (refreshedToken) {
            console.log('Token refreshed successfully during auth check');
            AppState.googleDriveConnected = true;
            AppState.googleDriveEmail = userInfo.email;

            // Save to user-specific storage
            localStorage.setItem(userGoogleEmailKey, userInfo.email);
            localStorage.setItem(userGoogleTokenKey, JSON.stringify(tokenInfo));

            return true;
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }

        showNotification('Google Drive session expired. Please reconnect in Settings.', 'warning');
        return false;
      }

      // Both user info AND valid token exist
      AppState.googleDriveConnected = true;
      AppState.googleDriveEmail = userInfo.email;

      // Save to user-specific storage
      localStorage.setItem(userGoogleEmailKey, userInfo.email);
      localStorage.setItem(userGoogleTokenKey, JSON.stringify(tokenInfo));

      console.log('✓ Google Drive authenticated for user:', AppState.userId);
      return true;
    } catch (error) {
      console.error('Google auth check error:', error);
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
