// ============================================
// MICROSOFT GRAPH API (OneDrive)
// ============================================
// This module provides Microsoft Graph API integration for OneDrive and Microsoft 365 services.
// It requires AppState and utility functions (showNotification, renderApp) to be defined globally.

const MicrosoftGraphAPI = {
  baseUrl: 'https://graph.microsoft.com/v1.0',

  async authenticateWithMicrosoft() {
    try {
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║   [RENDERER] MICROSOFT AUTH - User clicked login button   ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('⏰ Timestamp:', new Date().toISOString());
      console.log('\n🔍 CHECKING APP STATE:');
      console.log('   AppState.userId:', AppState.userId);
      console.log('   AppState.username:', AppState.username);
      console.log('   AppState object:', AppState);

      // Check if user is logged into the app first
      if (!AppState.userId) {
        console.error('❌ Cannot connect to Microsoft: No app user logged in');
        console.error('   → AppState.userId is:', AppState.userId);
        console.error('   → AppState.username is:', AppState.username);
        console.error('   → User must sign in to Community Curator first');
        showNotification('Please sign in to your Community Curator account first before connecting to Microsoft', 'error');
        return;
      }

      console.log('✅ App user logged in:', AppState.userId);
      console.log('📤 Calling window.electronAPI.login()...');

      const result = await window.electronAPI.login();

      if (result.success) {
        console.log('✅ Login request sent to main process');
        console.log('⏳ Browser should open shortly for user authentication');
        console.log('⏳ Waiting for "auth-success" event from main process...\n');
        showNotification('Authentication in progress...', 'info');
      }
    } catch (error) {
      console.error('\n╔════════════════════════════════════════════════════════════╗');
      console.error('║   [RENDERER] AUTHENTICATION ERROR                          ║');
      console.error('╚════════════════════════════════════════════════════════════╝');
      console.error('❌ Error:', error);
      showNotification('Login failed: ' + error.message, 'error');
    }
  },

  async checkAuthentication() {
    try {
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║   [RENDERER] CHECK AUTHENTICATION                          ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('⏰ Timestamp:', new Date().toISOString());

      // Check if user is logged in to the app first
      if (!AppState.userId) {
        console.log('ℹ️  No app user logged in');
        console.log('   → Skipping Microsoft authentication check\n');
        AppState.isAuthenticated = false;
        AppState.accessToken = null;
        AppState.userProfile = null;
        return false;
      }

      console.log('✅ App user logged in:', AppState.userId);

      // Load user-specific Microsoft auth from localStorage
      const userMsTokenKey = `ms_token_${AppState.userId}`;
      const userMsProfileKey = `ms_profile_${AppState.userId}`;

      const savedToken = localStorage.getItem(userMsTokenKey);
      const savedProfile = localStorage.getItem(userMsProfileKey);

      console.log('\n🔍 Checking localStorage for saved Microsoft credentials...');
      console.log('   Key:', userMsTokenKey);
      console.log('   Has saved token:', !!savedToken);
      console.log('   Has saved profile:', !!savedProfile);

      // If we have saved credentials for this user, use them
      if (savedToken && savedProfile) {
        AppState.accessToken = savedToken;
        AppState.userProfile = JSON.parse(savedProfile);
        AppState.isAuthenticated = true;
        console.log('✅ Found saved Microsoft credentials');
        console.log('   Email:', AppState.userProfile.email);
        console.log('   Token (first 30 chars):', savedToken.substring(0, 30) + '...');

        // Verify the saved token still works by making a simple API call
        try {
          console.log('\n🔄 Verifying saved token with Microsoft Graph API...');
          await this.graphFetch('/me');
          console.log('✅ Token verified - still valid!');
          console.log('🎉 Microsoft authentication restored successfully\n');
          return true;
        } catch (error) {
          // Token expired or invalid - clear it and try to get fresh one
          console.log('⚠️  Saved token expired or invalid');
          console.log('   Error:', error.message);
          console.log('   → Clearing saved credentials');
          console.log('   → Attempting to get fresh token from main process...');
          localStorage.removeItem(userMsTokenKey);
          localStorage.removeItem(userMsProfileKey);
          AppState.isAuthenticated = false;
          AppState.accessToken = null;
          AppState.userProfile = null;
          // Continue to try getting fresh token below
        }
      } else {
        console.log('ℹ️  No saved credentials found for this user');
      }

      // No saved credentials or they expired - check if main process has a fresh token (just logged in)
      console.log('\n📞 Requesting fresh token from main process...');
      console.log('   Calling window.electronAPI.getAccessToken()...');
      const token = await window.electronAPI.getAccessToken();

      if (!token) {
        console.log('\n❌ No token available from main process');
        console.log('   → User needs to click "Connect to Microsoft" to sign in\n');
        AppState.isAuthenticated = false;
        AppState.accessToken = null;
        AppState.userProfile = null;
        return false;
      }

      console.log('✅ Received fresh token from main process!');
      console.log('   Token (first 30 chars):', token.substring(0, 30) + '...');

      // Fresh token from main process - save it for this user
      AppState.accessToken = token;
      AppState.isAuthenticated = true;

      // Fetch user profile to verify token works
      try {
        console.log('\n📥 Fetching user profile from Microsoft Graph...');
        await this.getUserProfile();
        console.log('✅ User profile fetched successfully');
        console.log('   Email:', AppState.userProfile.email);
        console.log('   Display Name:', AppState.userProfile.displayName);
      } catch (profileError) {
        console.error('\n❌ Failed to fetch user profile');
        console.error('   Error:', profileError.message);
        console.error('   → Token may be invalid');
        AppState.isAuthenticated = false;
        AppState.accessToken = null;
        AppState.userProfile = null;
        showNotification('Microsoft authentication failed. Please try again.', 'error');
        return false;
      }

      // Save to user-specific storage
      console.log('\n💾 Saving credentials to localStorage...');
      console.log('   Token key:', userMsTokenKey);
      console.log('   Profile key:', userMsProfileKey);
      localStorage.setItem(userMsTokenKey, token);
      localStorage.setItem(userMsProfileKey, JSON.stringify(AppState.userProfile));
      console.log('   ✓ Credentials saved');

      console.log('\n🎉 MICROSOFT AUTHENTICATION SUCCESSFUL!');
      console.log('   User:', AppState.userId);
      console.log('   Email:', AppState.userProfile.email);
      console.log('   Profile saved to localStorage for future sessions\n');

      showNotification('Successfully connected to Microsoft!', 'success');

      // If user is on settings page, refresh it to show updated connection status
      if (AppState.currentView === 'settings') {
        renderSettings();
      }

      return true;
    } catch (error) {
      console.error('\n╔════════════════════════════════════════════════════════════╗');
      console.error('║   [RENDERER] AUTH CHECK ERROR                              ║');
      console.error('╚════════════════════════════════════════════════════════════╝');
      console.error('❌ Error:', error);
      AppState.isAuthenticated = false;
      AppState.accessToken = null;
      AppState.userProfile = null;
      return false;
    }
  },

  async logout() {
    try {
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║   [RENDERER] MICROSOFT LOGOUT                              ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('🚪 User requested logout');
      console.log('📤 Calling window.electronAPI.logout()...');

      await window.electronAPI.logout();

      // Clear user-specific Microsoft auth
      if (AppState.userId) {
        const userMsTokenKey = `ms_token_${AppState.userId}`;
        const userMsProfileKey = `ms_profile_${AppState.userId}`;
        console.log('🧹 Clearing localStorage...');
        console.log('   Removing:', userMsTokenKey);
        console.log('   Removing:', userMsProfileKey);
        localStorage.removeItem(userMsTokenKey);
        localStorage.removeItem(userMsProfileKey);
      }

      AppState.isAuthenticated = false;
      AppState.accessToken = null;
      AppState.userProfile = null;
      AppState.documents = [];
      AppState.microsoftForms = [];

      console.log('✅ Logout successful');
      console.log('   → All credentials cleared\n');
      showNotification('Disconnected from Microsoft', 'success');
      renderApp();
    } catch (error) {
      console.error('\n❌ Logout error:', error);
      showNotification('Logout failed', 'error');
    }
  },

  async graphFetch(path, options = {}) {
    // Use the token from AppState (user-specific), not from main process
    const token = AppState.accessToken;

    if (!token) {
      throw new Error('No access token available — please sign in');
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
      // Try to parse Graph JSON error for better debugging
      let bodyText = await res.text();
      let parsed = bodyText;
      try { parsed = JSON.parse(bodyText); } catch (_) { /* leave as text */ }

      // If 401, clear the saved token and surface auth error
      if (res.status === 401) {
        // Token expired - clear saved credentials
        if (AppState.userId) {
          localStorage.removeItem(`ms_token_${AppState.userId}`);
          localStorage.removeItem(`ms_profile_${AppState.userId}`);
        }
        AppState.isAuthenticated = false;
        AppState.accessToken = null;
        AppState.userProfile = null;

        const err = new Error('Unauthorized: Your session has expired. Please sign in again.');
        err.status = res.status;
        err.body = parsed;
        throw err;
      }

      // Check for admin consent required
      const errorMessage = (parsed && parsed.error && parsed.error.message) ? parsed.error.message.toLowerCase() : '';
      if (errorMessage.includes('admin') && errorMessage.includes('consent')) {
        const err = new Error('Admin consent required: This app needs administrator approval. Please contact your IT admin to grant consent for this application.');
        err.status = res.status;
        err.body = parsed;
        err.needsAdminConsent = true;
        throw err;
      }

      const err = new Error(`Microsoft Graph request failed: ${res.status} ${res.statusText} - ${JSON.stringify(parsed)}`);
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
      // Microsoft Forms API endpoint
      const response = await fetch(`${this.baseUrl}/me/drive/root/children?$filter=folder ne null`, {
        headers: {
          'Authorization': `Bearer ${AppState.accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // For now, return demo data as Forms API requires special permissions
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
      // Get user's OneDrive files
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

      // Surface detailed message to the user
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

    // Generate different responses based on form ID
    if (formId === 'form_1') {
      // Community Feedback Survey responses
      return [
        {
          id: 'response_1',
          submittedDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          submitter: 'john.doe@email.com',
          responses: {
            'How satisfied are you with our community services?': 'Very Satisfied',
            'What improvements would you like to see?': 'More community events and better communication channels',
            'Would you recommend our services to others?': 'Yes, definitely',
            'Additional comments': 'Great work! Keep it up!'
          }
        },
        {
          id: 'response_2',
          submittedDateTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          submitter: 'jane.smith@email.com',
          responses: {
            'How satisfied are you with our community services?': 'Satisfied',
            'What improvements would you like to see?': 'Better parking facilities and extended hours',
            'Would you recommend our services to others?': 'Yes',
            'Additional comments': 'Overall good experience'
          }
        },
        {
          id: 'response_3',
          submittedDateTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          submitter: 'mike.johnson@email.com',
          responses: {
            'How satisfied are you with our community services?': 'Neutral',
            'What improvements would you like to see?': 'More variety in programs offered',
            'Would you recommend our services to others?': 'Maybe',
            'Additional comments': 'Some things are good, but there is room for improvement'
          }
        },
        {
          id: 'response_4',
          submittedDateTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          submitter: 'sarah.williams@email.com',
          responses: {
            'How satisfied are you with our community services?': 'Very Satisfied',
            'What improvements would you like to see?': 'Online booking system would be helpful',
            'Would you recommend our services to others?': 'Yes, definitely',
            'Additional comments': 'Excellent staff and facilities!'
          }
        },
        {
          id: 'response_5',
          submittedDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          submitter: 'robert.brown@email.com',
          responses: {
            'How satisfied are you with our community services?': 'Satisfied',
            'What improvements would you like to see?': 'Better accessibility for disabled individuals',
            'Would you recommend our services to others?': 'Yes',
            'Additional comments': 'Very friendly and helpful team'
          }
        }
      ];
    } else if (formId === 'form_2') {
      // Event Registration Form responses
      return [
        {
          id: 'response_6',
          submittedDateTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          submitter: 'alice.martin@email.com',
          responses: {
            'Full Name': 'Alice Martin',
            'Email Address': 'alice.martin@email.com',
            'Phone Number': '+1-555-0123',
            'Number of Attendees': '2',
            'Dietary Requirements': 'Vegetarian',
            'How did you hear about this event?': 'Social Media'
          }
        },
        {
          id: 'response_7',
          submittedDateTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          submitter: 'david.lee@email.com',
          responses: {
            'Full Name': 'David Lee',
            'Email Address': 'david.lee@email.com',
            'Phone Number': '+1-555-0456',
            'Number of Attendees': '4',
            'Dietary Requirements': 'None',
            'How did you hear about this event?': 'Email Newsletter'
          }
        },
        {
          id: 'response_8',
          submittedDateTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          submitter: 'emily.davis@email.com',
          responses: {
            'Full Name': 'Emily Davis',
            'Email Address': 'emily.davis@email.com',
            'Phone Number': '+1-555-0789',
            'Number of Attendees': '1',
            'Dietary Requirements': 'Gluten-free',
            'How did you hear about this event?': 'Friend Referral'
          }
        }
      ];
    } else if (formId === 'form_3') {
      // Volunteer Interest Form responses
      return [
        {
          id: 'response_9',
          submittedDateTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          submitter: 'chris.wilson@email.com',
          responses: {
            'Full Name': 'Chris Wilson',
            'Email Address': 'chris.wilson@email.com',
            'Phone Number': '+1-555-1111',
            'Availability': 'Weekends',
            'Areas of Interest': 'Community Outreach, Event Planning',
            'Previous Volunteer Experience': 'Yes, 3 years at local food bank',
            'Why do you want to volunteer?': 'I want to give back to the community and meet new people'
          }
        },
        {
          id: 'response_10',
          submittedDateTime: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
          submitter: 'lisa.taylor@email.com',
          responses: {
            'Full Name': 'Lisa Taylor',
            'Email Address': 'lisa.taylor@email.com',
            'Phone Number': '+1-555-2222',
            'Availability': 'Weekday Evenings',
            'Areas of Interest': 'Youth Programs, Education',
            'Previous Volunteer Experience': 'No, but eager to learn',
            'Why do you want to volunteer?': 'Passionate about helping young people in the community'
          }
        }
      ];
    }

    // Default responses
    return [
      {
        id: 'response_1',
        submittedDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        submitter: 'john.doe@email.com',
        responses: {
          'Question 1': 'Sample answer 1',
          'Question 2': 'Sample answer 2'
        }
      },
      {
        id: 'response_2',
        submittedDateTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        submitter: 'jane.smith@email.com',
        responses: {
          'Question 1': 'Sample answer 3',
          'Question 2': 'Sample answer 4'
        }
      }
    ];
  }
};
