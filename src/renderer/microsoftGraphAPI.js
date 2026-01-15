// ============================================
// MICROSOFT GRAPH API (OneDrive)
// ============================================

const MicrosoftGraphAPI = {
  baseUrl: 'https://graph.microsoft.com/v1.0',

  async authenticateWithMicrosoft() {
    try {
      console.log('Starting Microsoft authentication...');
      const result = await window.electronAPI.login();

      if (result.success) {
        console.log('Authentication window opened, waiting for response...');
        showNotification('Authentication in progress...', 'info');
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification('Login failed: ' + error.message, 'error');
    }
  },

  async checkAuthentication() {
    try {
      const token = await window.electronAPI.getAccessToken();

      if (token) {
        AppState.accessToken = token;
        AppState.isAuthenticated = true;
        await this.getUserProfile();
        console.log('User authenticated:', AppState.userProfile);
        showNotification('Successfully logged in!', 'success');
        renderApp();
      } else {
        AppState.isAuthenticated = false;
        AppState.accessToken = null;
        AppState.userProfile = null;
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  },

  async logout() {
    try {
      await window.electronAPI.logout();
      AppState.isAuthenticated = false;
      AppState.accessToken = null;
      AppState.userProfile = null;
      AppState.documents = [];
      AppState.microsoftForms = [];

      showNotification('Logged out successfully', 'success');
      renderApp();
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Logout failed', 'error');
    }
  },

  async graphFetch(path, options = {}) {
    const token = await window.electronAPI.getAccessToken();
    if (!token) {
      throw new Error('No access token available – please sign in');
    }

    const url = this.baseUrl + path;
    const fetchOptions = Object.assign({
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }, options);

    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
      let bodyText = await res.text();
      let parsed = bodyText;
      try { parsed = JSON.parse(bodyText); } catch (_) {}

      if (res.status === 401) {
        const err = new Error('Unauthorized: Your session has expired. Please sign in again.');
        err.status = res.status;
        err.body = parsed;
        throw err;
      }

      const errorMessage = (parsed && parsed.error && parsed.error.message) ? parsed.error.message.toLowerCase() : '';
      if (errorMessage.includes('admin') && errorMessage.includes('consent')) {
        const err = new Error('Admin consent required: This app needs administrator approval.');
        err.status = res.status;
        err.body = parsed;
        err.needsAdminConsent = true;
        throw err;
      }

      const err = new Error(`Microsoft Graph request failed: ${res.status} ${res.statusText}`);
      err.status = res.status;
      err.body = parsed;
      throw err;
    }

    return res.json();
  },

  async getUserProfile() {
    try {
      const profile = await this.graphFetch('/me');
      AppState.userProfile = {
        name: profile.displayName || profile.userPrincipalName,
        email: profile.mail || profile.userPrincipalName
      };
      return AppState.userProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  async getForms() {
    if (!AppState.isAuthenticated || !AppState.accessToken) {
      console.log('Not authenticated');
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/me/drive/root/children?$filter=folder ne null`, {
        headers: {
          'Authorization': `Bearer ${AppState.accessToken}`
        }
      });

      if (response.ok) {
        return this.getDemoForms();
      } else {
        console.log('Using demo forms data');
        return this.getDemoForms();
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      return this.getDemoForms();
    }
  },

  getDemoForms() {
    return [
      {
        id: 'form_1',
        title: 'Community Feedback Survey',
        description: 'Help us improve our community services',
        webUrl: 'https://forms.office.com/Pages/ResponsePage.aspx?id=example1',
        createdDateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastModifiedDateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        responseCount: 24,
        isAcceptingResponses: true
      },
      {
        id: 'form_2',
        title: 'Event Registration Form',
        description: 'Register for our upcoming community event',
        webUrl: 'https://forms.office.com/Pages/ResponsePage.aspx?id=example2',
        createdDateTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        lastModifiedDateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        responseCount: 47,
        isAcceptingResponses: true
      },
      {
        id: 'form_3',
        title: 'Volunteer Interest Form',
        description: 'Sign up to volunteer with our organization',
        webUrl: 'https://forms.office.com/Pages/ResponsePage.aspx?id=example3',
        createdDateTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastModifiedDateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        responseCount: 15,
        isAcceptingResponses: false
      }
    ];
  },

  async getOneDriveFiles() {
    if (!AppState.isAuthenticated) {
      console.log('Not authenticated');
      return [];
    }

    try {
      const path = '/me/drive/root/children';
      const data = await this.graphFetch(path);

      return (data.value || []).map(file => ({
        id: file.id,
        title: file.name,
        content: file.name,
        source: 'onedrive',
        created_at: file.createdDateTime,
        updated_at: file.lastModifiedDateTime,
        webUrl: file.webUrl,
        size: file.size,
        mimeType: file.file ? file.file.mimeType : 'folder'
      }));
    } catch (error) {
      console.error('Error fetching OneDrive files:', error);

      const message = error.needsAdminConsent
        ? 'Admin consent required. Please contact your IT administrator.'
        : (error && error.body && error.body.error && error.body.error.message)
        ? error.body.error.message
        : error.message || String(error);

      showNotification('Failed to fetch OneDrive files: ' + message, 'error');
      return [];
    }
  },

  async getFormResponses(formId) {
    if (!AppState.isAuthenticated) {
      return [];
    }

    if (formId === 'form_1') {
      return [
        {
          id: 'response_1',
          submittedDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          submitter: 'john.doe@email.com',
          responses: {
            'How satisfied are you with our community services?': 'Very Satisfied',
            'What improvements would you like to see?': 'More community events',
            'Would you recommend our services to others?': 'Yes, definitely'
          }
        },
        {
          id: 'response_2',
          submittedDateTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          submitter: 'jane.smith@email.com',
          responses: {
            'How satisfied are you with our community services?': 'Satisfied',
            'What improvements would you like to see?': 'Better parking facilities',
            'Would you recommend our services to others?': 'Yes'
          }
        }
      ];
    } else if (formId === 'form_2') {
      return [
        {
          id: 'response_6',
          submittedDateTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          submitter: 'alice.martin@email.com',
          responses: {
            'Full Name': 'Alice Martin',
            'Email Address': 'alice.martin@email.com',
            'Number of Attendees': '2',
            'Dietary Requirements': 'Vegetarian'
          }
        }
      ];
    } else if (formId === 'form_3') {
      return [
        {
          id: 'response_9',
          submittedDateTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          submitter: 'chris.wilson@email.com',
          responses: {
            'Full Name': 'Chris Wilson',
            'Availability': 'Weekends',
            'Areas of Interest': 'Community Outreach'
          }
        }
      ];
    }

    return [];
  }
};

// Export to global scope
if (typeof window !== 'undefined') {
  window.MicrosoftGraphAPI = MicrosoftGraphAPI;
}