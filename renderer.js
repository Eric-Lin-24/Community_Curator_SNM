// Community Curator - Main Application Entry Point

// ============================================
// APP STATE
// ============================================
const AppState = {
  currentView: 'dashboard',
  documents: [],
  scheduledMessages: [],
  microsoftForms: [],
  connections: [],
  templates: [],
  formSubmissions: [],
  selectedForm: null,
  isAuthenticated: false,
  accessToken: null,
  userProfile: null,
  whatsappConnected: false,
  whatsappPhone: '',
  googleDriveConnected: false,
  googleDriveEmail: '',
  activeDocumentSource: 'onedrive', // 'onedrive' or 'googledrive'
  subscribedChats: [], // List of subscribed chat IDs from Azure VM
  azureVmUrl: '', // Azure VM URL for fetching chat IDs
  loadingSubscribedChats: false
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString();
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString();
}

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

        // Fetch user profile
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
    // Ensure we have a valid access token from main process
    const token = await window.electronAPI.getAccessToken();
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

      // If 401, surface auth error so UI can prompt re-login
      if (res.status === 401) {
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

// ============================================
// GOOGLE DRIVE API
// ============================================
const GoogleDriveAPI = {
  async authenticateWithGoogle() {
    try {
      console.log('Starting Google Drive authentication...');
      // Simulated for now - in a real app this would use Google OAuth
      showNotification('Google Drive authentication coming soon...', 'info');

      // For demo purposes, simulate connection
      const email = prompt('Enter your Google email (demo):');
      if (email) {
        AppState.googleDriveConnected = true;
        AppState.googleDriveEmail = email;
        showNotification('Successfully connected to Google Drive!', 'success');
        renderApp();
      }
    } catch (error) {
      console.error('Google Drive login error:', error);
      showNotification('Google Drive login failed: ' + error.message, 'error');
    }
  },

  async logout() {
    try {
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
      // Simulated Google Drive files for demo
      // In a real app, this would call the Google Drive API
      showNotification('Loading Google Drive files...', 'info');

      const demoFiles = [
        {
          id: 'gdrive_' + generateId(),
          title: 'Community Guidelines.pdf',
          content: 'Guidelines for community members and volunteers',
          source: 'googledrive',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          webUrl: 'https://drive.google.com/file/sample1',
          size: 524288,
          mimeType: 'application/pdf'
        },
        {
          id: 'gdrive_' + generateId(),
          title: 'Event Planning Template.docx',
          content: 'Template for planning community events',
          source: 'googledrive',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          webUrl: 'https://drive.google.com/file/sample2',
          size: 1048576,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        },
        {
          id: 'gdrive_' + generateId(),
          title: 'Volunteer Schedule 2024.xlsx',
          content: 'Schedule for all volunteers throughout the year',
          source: 'googledrive',
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          webUrl: 'https://drive.google.com/file/sample3',
          size: 2097152,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        {
          id: 'gdrive_' + generateId(),
          title: 'Fundraising Report Q4.pdf',
          content: 'Quarterly fundraising performance and analysis',
          source: 'googledrive',
          created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          webUrl: 'https://drive.google.com/file/sample4',
          size: 3145728,
          mimeType: 'application/pdf'
        }
      ];

      return demoFiles;
    } catch (error) {
      console.error('Error fetching Google Drive files:', error);
      showNotification('Failed to fetch Google Drive files: ' + error.message, 'error');
      return [];
    }
  }
};

// ============================================
// ACTION HANDLERS (Stub functions for buttons)
// ============================================
function switchDocumentSource(source) {
  if (source === 'googledrive' && !AppState.googleDriveConnected) {
    showNotification('Please connect to Google Drive first in Settings', 'warning');
    navigateTo('settings');
    return;
  }

  if (source === 'onedrive' && !AppState.isAuthenticated) {
    showNotification('Please sign in with Microsoft 365 first in Settings', 'warning');
    navigateTo('settings');
    return;
  }

  AppState.activeDocumentSource = source;

  // Refresh documents for the selected source
  if (source === 'onedrive') {
    refreshOneDriveDocs();
  } else if (source === 'googledrive') {
    refreshGoogleDriveDocs();
  }
}

async function refreshGoogleDriveDocs() {
  if (!AppState.googleDriveConnected) {
    showNotification('Please connect to Google Drive first', 'warning');
    return;
  }

  showNotification('Syncing Google Drive files...', 'info');

  try {
    const files = await GoogleDriveAPI.getGoogleDriveFiles();
    // Replace documents with Google Drive files
    AppState.documents = files;
    renderDocuments();
    showNotification(`Synced ${files.length} files from Google Drive`, 'success');
  } catch (error) {
    console.error('Error syncing Google Drive:', error);
    showNotification('Failed to sync Google Drive files', 'error');
  }
}

function refreshCloudDocs() {
  if (AppState.activeDocumentSource === 'googledrive') {
    refreshGoogleDriveDocs();
  } else {
    refreshOneDriveDocs();
  }
}

async function refreshOneDriveDocs() {
  if (!AppState.isAuthenticated) {
    showNotification('Please sign in with Microsoft 365 first', 'warning');
    return;
  }

  showNotification('Syncing OneDrive files...', 'info');

  try {
    const files = await MicrosoftGraphAPI.getOneDriveFiles();
    AppState.documents = files;
    renderDocuments();
    showNotification(`Synced ${files.length} files from OneDrive`, 'success');
  } catch (error) {
    console.error('Error syncing OneDrive:', error);
    showNotification('Failed to sync OneDrive files', 'error');
  }
}

// ============================================
// AZURE VM API - Chat Subscriptions
// ============================================
const AzureVMAPI = {
  async fetchSubscribedChats() {
    if (!AppState.azureVmUrl) {
      throw new Error('Azure VM URL not configured. Please set it in Settings.');
    }

    AppState.loadingSubscribedChats = true;

    try {
      const response = await fetch(`${AppState.azureVmUrl}/subscribed_users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Add timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch subscribed chats: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data); // Debug log

      // Handle array response directly (your API returns array)
      let rawChats = [];
      if (Array.isArray(data)) {
        rawChats = data;
      } else if (data && Array.isArray(data.chats)) {
        rawChats = data.chats;
      } else if (data && Array.isArray(data.users)) {
        rawChats = data.users;
      } else {
        console.error('Unexpected response format:', data);
        throw new Error('Invalid response format from Azure VM');
      }

      // Map your schema (user_id, chat_id, chat_name, created_at) to internal format
      const formattedChats = rawChats.map(chat => ({
        id: chat.chat_id || chat.id,           // Use chat_id as the primary ID
        name: chat.chat_name || chat.name || chat.chat_id || 'Unknown Chat',  // Use chat_name
        platform: chat.platform || 'whatsapp',  // Default to whatsapp if not specified
        type: chat.type || 'group',             // Default to group if not specified
        user_id: chat.user_id,                  // Keep user_id for reference
        created_at: chat.created_at             // Keep created_at for reference
      }));

      console.log('Formatted chats:', formattedChats); // Debug log
      AppState.subscribedChats = formattedChats;
      return formattedChats;
    } catch (error) {
      console.error('Error fetching subscribed chats:', error);
      throw error;
    } finally {
      AppState.loadingSubscribedChats = false;
    }
  },

  async refreshSubscribedChats() {
    try {
      showNotification('Fetching subscribed chats...', 'info');
      const chats = await this.fetchSubscribedChats();
      showNotification(`Loaded ${chats.length} subscribed chat(s)`, 'success');

      // If we're on the scheduling page, re-render to show updated list
      if (AppState.currentView === 'scheduling') {
        renderScheduling();
      }
    } catch (error) {
      showNotification('Failed to fetch subscribed chats: ' + error.message, 'error');
    }
  },

  async scheduleMessage(targetUserId, message, scheduledTimestamp, files = []) {
    if (!AppState.azureVmUrl) {
      throw new Error('Azure VM URL not configured. Please set it in Settings.');
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('target_user_id', targetUserId.toString());
    formData.append('message', message);
    formData.append('scheduled_timestamp', scheduledTimestamp); // ISO 8601 format

    // Add files if any
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
    }

    console.log('Sending POST to:', `${AppState.azureVmUrl}/schedule_message`);
    console.log('Payload:', {
      target_user_id: targetUserId,
      message: message,
      scheduled_timestamp: scheduledTimestamp,
      files_count: files.length
    });

    // Send POST request
    const response = await fetch(`${AppState.azureVmUrl}/schedule_message`, {
      method: 'POST',
      body: formData
      // Don't set Content-Type - browser handles it for FormData
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, try text
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch (e2) {
          // Keep default error message
        }
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Schedule successful:', result);
    return result;
  }
};

// Load subscribed chats when app initializes
async function initializeSubscribedChats() {
  // Try to load Azure VM URL from localStorage
  const savedAzureUrl = localStorage.getItem('azureVmUrl');
  if (savedAzureUrl) {
    AppState.azureVmUrl = savedAzureUrl;

    // Attempt to fetch subscribed chats in background
    try {
      await AzureVMAPI.fetchSubscribedChats();
      console.log('Subscribed chats loaded:', AppState.subscribedChats.length);
    } catch (error) {
      console.warn('Could not load subscribed chats on init:', error.message);
    }
  }
}

function showModal(type) {
  let modalHtml = '';

  switch(type) {
    case 'newMessage':
      // Generate options for subscribed chats
      console.log('Generating chat options from:', AppState.subscribedChats); // Debug log

      const subscribedChatsOptions = AppState.subscribedChats.map((chat, index) => {
        // Robust field extraction
        const chatId = chat.id || chat.chat_id || `chat_${index}`;
        const chatName = chat.name || chat.chat_name || chatId;
        const platform = chat.platform || 'whatsapp';

        console.log(`Chat ${index}:`, { chatId, chatName, platform, raw: chat }); // Debug log

        return `<option value="${chatId}" data-platform="${platform}">${chatName} (${platform})</option>`;
      }).join('');

      console.log('Generated options HTML:', subscribedChatsOptions); // Debug log

      modalHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target === this) hideModal()">
          <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 mx-4 max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-semibold mb-4">Schedule Message</h3>
            <form onsubmit="scheduleMessage(event)">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Messaging Platform</label>
                <select
                  id="msg-platform"
                  required
                  onchange="toggleRecipientInput()"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="whatsapp" selected>WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="telegram">Telegram</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <!-- Subscribed Chats Section -->
              <div id="subscribed-chats-section" class="mb-4">
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-medium text-gray-700">Subscribed Chats</label>
                  <button
                    type="button"
                    onclick="refreshSubscribedChatsInModal()"
                    class="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    title="Refresh subscribed chats"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
                ${AppState.subscribedChats.length > 0 ? `
                  <select
                    id="msg-subscribed-chat"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    onchange="onSubscribedChatSelect()"
                  >
                    <option value="">-- Select from subscribed chats --</option>
                    ${subscribedChatsOptions}
                  </select>
                ` : `
                  <div class="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    ${AppState.azureVmUrl ? 'No subscribed chats found. Click refresh to load.' : 'Configure Azure VM URL in Settings to load subscribed chats.'}
                  </div>
                `}
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                <input
                  type="text"
                  id="msg-recipient"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter recipient name or number"
                />
                <p class="text-xs text-gray-500 mt-1">Or select from subscribed chats above</p>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                <textarea
                  id="msg-content"
                  rows="6"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter message content"
                ></textarea>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Attach Files (Optional)</label>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                  <input
                    type="file"
                    id="msg-attachments"
                    multiple
                    class="hidden"
                    onchange="handleFileSelect(event)"
                  />
                  <label for="msg-attachments" class="cursor-pointer block">
                    <div class="flex flex-col items-center justify-center">
                      <div class="p-3 bg-blue-100 rounded-full mb-3">
                        <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p class="text-sm font-medium text-gray-700 mb-1">Click to upload or drag and drop</p>
                      <p class="text-xs text-gray-500">PDF, DOC, Images (Max 10MB each)</p>
                    </div>
                  </label>
                </div>
                <div id="file-list" class="mt-3 space-y-2"></div>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  id="msg-schedule"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  onclick="hideModal()"
                  class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
      break;
    default:
      alert('Modal functionality coming soon: ' + type);
      return;
  }

  const modalContainer = document.createElement('div');
  modalContainer.id = 'modal-overlay';
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);
}

function hideModal() {
  const modal = document.getElementById('modal-overlay');
  if (modal) {
    modal.remove();
  }
}

// Helper function to select a subscribed chat
function onSubscribedChatSelect() {
  const select = document.getElementById('msg-subscribed-chat');
  const recipientInput = document.getElementById('msg-recipient');
  const platformSelect = document.getElementById('msg-platform');

  if (select && recipientInput && select.value) {
    const selectedOption = select.options[select.selectedIndex];
    const chatId = select.value;
    const platform = selectedOption.getAttribute('data-platform') || 'whatsapp';

    // Find the chat object to get the full details
    const chat = AppState.subscribedChats.find(c => c.id === chatId);
    if (chat) {
      // Set recipient to chat name or ID
      recipientInput.value = chat.name || chat.id;

      // Set platform if it matches one of our options
      const platformLower = platform.toLowerCase();
      if (['whatsapp', 'sms', 'telegram', 'email'].includes(platformLower)) {
        platformSelect.value = platformLower;
      }
    }
  }
}

// Helper function to refresh subscribed chats in modal
async function refreshSubscribedChatsInModal() {
  try {
    showNotification('Refreshing subscribed chats...', 'info');
    await AzureVMAPI.fetchSubscribedChats();
    showNotification(`Loaded ${AppState.subscribedChats.length} subscribed chat(s)`, 'success');

    // Re-render the modal
    hideModal();
    showModal('newMessage');
  } catch (error) {
    showNotification('Failed to refresh: ' + error.message, 'error');
  }
}

// Helper function to toggle recipient input visibility
function toggleRecipientInput() {
  // This can be expanded if needed for different platforms
  // For now, all platforms use the same recipient input
}

async function scheduleMessage(event) {
  event.preventDefault();

  if (!AppState.azureVmUrl) {
    showNotification('Please configure Azure VM URL in Settings first', 'error');
    return;
  }

  const platform = document.getElementById('msg-platform').value;
  const recipient = document.getElementById('msg-recipient').value;
  const content = document.getElementById('msg-content').value;
  const scheduledTime = document.getElementById('msg-schedule').value;
  const fileInput = document.getElementById('msg-attachments');
  const selectedChatSelect = document.getElementById('msg-subscribed-chat');

  // Validate inputs
  if (!content || !scheduledTime) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }

  // Get the target_user_id from selected chat
  let targetUserId = null;
  if (selectedChatSelect && selectedChatSelect.value) {
    const selectedChat = AppState.subscribedChats.find(c => c.id === selectedChatSelect.value);
    if (selectedChat && selectedChat.user_id) {
      targetUserId = selectedChat.user_id;
    }
  }

  // If no chat selected, try to find by chat_id from recipient
  if (!targetUserId && recipient) {
    const chatByName = AppState.subscribedChats.find(c =>
      c.name === recipient || c.id === recipient || c.chat_id === recipient
    );
    if (chatByName && chatByName.user_id) {
      targetUserId = chatByName.user_id;
    }
  }

  if (!targetUserId) {
    showNotification('Could not determine target user. Please select a chat from the dropdown.', 'error');
    return;
  }

  // Convert scheduled time to ISO 8601 format (YYYY-MM-DDTHH:MM:SS.sssZ)
  const scheduledTimestamp = new Date(scheduledTime).toISOString();

  // Get files
  const files = fileInput && fileInput.files.length > 0 ? Array.from(fileInput.files) : [];

  // Show loading
  showNotification('Scheduling message...', 'info');

  try {
    // Use AzureVMAPI to schedule the message
    const result = await AzureVMAPI.scheduleMessage(targetUserId, content, scheduledTimestamp, files);

    // Store message locally for UI display
    const newMessage = {
      id: result.id || result.message_id || generateId(),
      platform: platform,
      recipient: recipient,
      content: content,
      message_content: content,
      scheduled_time: scheduledTime,
      scheduled_timestamp: scheduledTimestamp,
      target_user_id: targetUserId,
      status: result.status || 'pending',
      created_at: new Date().toISOString(),
      server_response: result
    };

    AppState.scheduledMessages.push(newMessage);
    hideModal();
    renderScheduling();

    showNotification(
      `✓ Message scheduled successfully! Will be sent ${formatDateTime(scheduledTime)}`,
      'success'
    );
  } catch (error) {
    console.error('Error scheduling message:', error);
    showNotification('Failed to schedule message: ' + error.message, 'error');
  }
}

function handleFileSelect(event) {
  const files = event.target.files;
  const fileList = document.getElementById('file-list');

  if (!fileList) return;

  fileList.innerHTML = '';

  Array.from(files).forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow';
    fileItem.innerHTML = `
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div class="p-2 bg-blue-50 rounded-lg flex-shrink-0">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-700 truncate">${file.name}</p>
          <p class="text-xs text-gray-500 mt-0.5">${(file.size / 1024).toFixed(1)} KB</p>
        </div>
      </div>
      <button
        type="button"
        onclick="removeFile(${index})"
        class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2 flex-shrink-0"
        title="Remove file"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    `;
    fileList.appendChild(fileItem);
  });
}

function removeFile(index) {
  const fileInput = document.getElementById('msg-attachments');
  if (!fileInput) return;

  const dt = new DataTransfer();
  const files = fileInput.files;

  for (let i = 0; i < files.length; i++) {
    if (i !== index) {
      dt.items.add(files[i]);
    }
  }

  fileInput.files = dt.files;
  handleFileSelect({ target: fileInput });
}

// ============================================
// NAVIGATION
// ============================================
function navigateTo(view) {
  AppState.currentView = view;
  renderApp();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('hidden');
}

// ============================================
// VIEW RENDERING
// ============================================
function renderApp() {
  const contentArea = document.getElementById('content');
  const navItems = document.querySelectorAll('.nav-item');

  // Update active nav item
  navItems.forEach(item => {
    if (item.dataset.view === AppState.currentView) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update header with consistent titles
  const titles = {
    dashboard: { title: 'Dashboard', subtitle: 'Welcome back! Here\'s an overview of your community platform' },
    documents: { title: 'Documents', subtitle: 'Manage and sync your OneDrive files' },
    scheduling: { title: 'Message Scheduling', subtitle: 'Schedule and manage automated messages' },
    forms: { title: 'Microsoft Forms', subtitle: 'Create forms and view responses' },
    settings: { title: 'Settings', subtitle: 'Configure your application preferences' }
  };

  const header = titles[AppState.currentView];
  document.getElementById('view-title').textContent = header.title;
  document.getElementById('view-subtitle').textContent = header.subtitle;

  // Render content based on view
  switch (AppState.currentView) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'documents':
      renderDocuments();
      break;
    case 'scheduling':
      renderScheduling();
      break;
    case 'forms':
      renderForms();
      break;
    case 'settings':
      renderSettings();
      break;
    default:
      renderDashboard();
  }
}

// ============================================
// DASHBOARD VIEW
// ============================================
function createStatCard(title, value, subtitle, color, icon) {
  const colors = {
    blue: { text: 'text-blue-600', bg: 'bg-blue-50' },
    green: { text: 'text-green-600', bg: 'bg-green-50' },
    orange: { text: 'text-orange-600', bg: 'bg-orange-50' },
    purple: { text: 'text-purple-600', bg: 'bg-purple-50' }
  };

  const c = colors[color];

  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-600 mb-1">${title}</p>
          <p class="text-3xl font-bold text-gray-800 mb-1">${value.toLocaleString()}</p>
          <p class="text-xs text-gray-500">${subtitle}</p>
        </div>
        <div class="p-3 rounded-lg ${c.bg}">
          <div class="${c.text}">${icon}</div>
        </div>
      </div>
    </div>
  `;
}

function renderDashboard() {
  const content = document.getElementById('content');

  const activeConversations = AppState.scheduledMessages.filter(m => m.status === 'sent').length;
  const upcomingMessages = AppState.scheduledMessages
    .filter(m => m.status === 'pending' && new Date(m.scheduled_time) > new Date())
    .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time))
    .slice(0, 5);
  const recentDocuments = [...AppState.documents]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const totalFormResponses = AppState.microsoftForms.reduce((sum, form) => sum + (form.responseCount || 0), 0);

  content.innerHTML = `
    <div class="space-y-6">
      <div>
        <h3 class="text-2xl font-bold text-gray-800 mb-2">Overview</h3>
        <p class="text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        ${createStatCard('Total Documents', AppState.documents.length, 'All documents', 'blue', `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        `)}
        ${createStatCard('Active Conversations', activeConversations, 'Messages sent', 'green', `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        `)}
        ${createStatCard('Scheduled Messages', AppState.scheduledMessages.filter(m => m.status === 'pending').length, 'Pending delivery', 'orange', `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 01-2 2z" />
          </svg>
        `)}
        ${createStatCard('Form Responses', totalFormResponses, 'Total submissions', 'purple', `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        `)}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 class="font-semibold text-gray-800">Upcoming Scheduled Messages</h4>
              </div>
              <span class="text-sm text-gray-500">${upcomingMessages.length} pending</span>
            </div>
          </div>
          <div class="p-6">
            ${upcomingMessages.length === 0 ? `
              <div class="text-center py-8 text-gray-500">
                <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 01-2 2z" />
                </svg>
                <p class="text-sm">No upcoming messages</p>
              </div>
            ` : `
              <div class="space-y-3">
                ${upcomingMessages.map(msg => `
                  <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div class="p-2 bg-orange-100 text-orange-600 rounded-lg">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-gray-800 text-sm mb-1">To: ${msg.recipient}</p>
                      <p class="text-xs text-gray-600 line-clamp-2 mb-2">${msg.message_content}</p>
                      <div class="flex items-center gap-3 text-xs text-gray-500">
                        <span>${formatDate(msg.scheduled_time)}</span>
                        <span>•</span>
                        <span>${formatTime(msg.scheduled_time)}</span>
                        <span>•</span>
                        <span class="capitalize">${msg.platform}</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h4 class="font-semibold text-gray-800">Recent Documents</h4>
              </div>
              <span class="text-sm text-gray-500">${AppState.documents.length} total</span>
            </div>
          </div>
          <div class="p-6">
            ${recentDocuments.length === 0 ? `
              <div class="text-center py-8 text-gray-500">
                <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="text-sm">No documents yet</p>
              </div>
            ` : `
              <div class="space-y-3">
                ${recentDocuments.map(doc => `
                  <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div class="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-gray-800 text-sm mb-1">${doc.title}</p>
                      <p class="text-xs text-gray-600 line-clamp-2 mb-2">${doc.content}</p>
                      <div class="flex items-center gap-3 text-xs text-gray-500">
                        <span>${formatDate(doc.created_at)}</span>
                        <span>•</span>
                        <span class="capitalize">${doc.source || 'local'}</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 text-white">
        <div class="flex items-start justify-between">
          <div>
            <h4 class="text-xl font-semibold mb-2 flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Getting Started
            </h4>
            <p class="text-blue-100 mb-4">Start managing your community communications effectively</p>
            <ul class="space-y-2 text-sm text-blue-50">
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Create document collections to organize content</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Schedule WhatsApp messages for your community</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Use Microsoft Forms to collect data from members</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Connect to SharePoint for document syncing</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// DOCUMENTS VIEW
// ============================================
function renderDocuments() {
  const content = document.getElementById('content');

  // Documents only come from SharePoint
  if (!AppState.isAuthenticated && !AppState.googleDriveConnected) {
    content.innerHTML = `
      <div class="space-y-6">
        <div>
          <h3 class="text-2xl font-bold text-gray-800">Documents</h3>
          <p class="text-gray-600">Access your cloud documents</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Connect to Cloud Storage</h3>
          <p class="text-gray-600 mb-4">Sign in to access your documents from OneDrive or Google Drive</p>
          <div class="flex gap-3 justify-center">
            <button
              onclick="MicrosoftGraphAPI.authenticateWithMicrosoft()"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign in with Microsoft
            </button>
            <button
              onclick="GoogleDriveAPI.authenticateWithGoogle()"
              class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const documents = AppState.documents;
  const searchQuery = AppState.documentSearchQuery || '';
  const selectedDocs = AppState.selectedDocuments || [];
  const activeSource = AppState.activeDocumentSource || 'onedrive';

  // Filter documents
  let filteredDocuments = documents;
  if (searchQuery) {
    filteredDocuments = filteredDocuments.filter(d =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Determine provider display info
  const isOneDrive = activeSource === 'onedrive';
  const providerName = isOneDrive ? 'OneDrive' : 'Google Drive';
  const syncButtonColor = isOneDrive ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700';

  content.innerHTML = `
    <div class="space-y-6">
      <!-- Storage Provider Switcher -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-gray-800 mb-1">Storage Provider</h3>
            <p class="text-sm text-gray-600">Choose where to manage your documents</p>
          </div>
          <div class="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onclick="switchDocumentSource('onedrive')"
              class="px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                activeSource === 'onedrive'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }"
            >
              OneDrive
            </button>
            <button
              onclick="switchDocumentSource('googledrive')"
              class="px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                activeSource === 'googledrive'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }"
            >
              Google Drive
            </button>
          </div>
        </div>
      </div>

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-2xl font-bold text-gray-800">${providerName} Files</h3>
          <p class="text-gray-600">Your files synced from ${providerName}</p>
        </div>
        <div class="flex gap-2">
          <button
            onclick="refreshCloudDocs()"
            class="flex items-center gap-2 px-4 py-2 ${syncButtonColor} text-white rounded-lg transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Sync ${providerName}</span>
          </button>
          <button
            onclick="showNewDocumentModal()"
            class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Document</span>
          </button>
        </div>
      </div>

      <!-- Search Bar and Bulk Actions -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <div class="relative flex-1">
              <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search documents..."
                value="${searchQuery}"
                onkeyup="updateDocumentSearch(this.value)"
                class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
              />
            </div>
            <select class="px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer h-10" style="min-width: 200px;">
              <option value="">Sort by: Date (Newest)</option>
              <option value="date-oldest">Sort by: Date (Oldest)</option>
              <option value="name-az">Sort by: Name (A-Z)</option>
              <option value="name-za">Sort by: Name (Z-A)</option>
            </select>
            <select class="px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer h-10" style="min-width: 180px;">
              <option value="">Filter: All Types</option>
              <option value="pdf">Filter: PDF</option>
              <option value="doc">Filter: Documents</option>
              <option value="spreadsheet">Filter: Spreadsheets</option>
            </select>
          </div>

          ${selectedDocs.length > 0 ? `
            <div class="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-sm font-medium text-blue-900">${selectedDocs.length} document${selectedDocs.length > 1 ? 's' : ''} selected</span>
              </div>
              <div class="flex gap-2">
                <button
                  onclick="bulkDownloadDocuments()"
                  class="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
                <button
                  onclick="bulkShareDocuments()"
                  class="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
                <button
                  onclick="bulkDeleteDocuments()"
                  class="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
                <button
                  onclick="clearDocumentSelection()"
                  class="px-3 py-1.5 text-gray-700 text-sm hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      ${filteredDocuments.length === 0 ? `
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="text-xl font-semibold text-gray-800 mb-2">No documents found</h3>
          <p class="text-gray-600 mb-4">Sync your OneDrive or Google Drive to see documents here</p>
          <button
            onclick="refreshCloudDocs()"
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Sync ${providerName}
          </button>
        </div>
      ` : `
        <div class="space-y-3">
          <div class="flex items-center gap-2 px-2">
            <input
              type="checkbox"
              id="select-all-docs"
              ${selectedDocs.length === filteredDocuments.length && filteredDocuments.length > 0 ? 'checked' : ''}
              onchange="toggleSelectAllDocuments(this.checked)"
              class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label for="select-all-docs" class="text-sm font-medium text-gray-700 cursor-pointer">
              Select all (${filteredDocuments.length})
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${filteredDocuments.map(doc => `
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${selectedDocs.includes(doc.id) ? 'ring-2 ring-blue-500' : ''}">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <input
                      type="checkbox"
                      ${selectedDocs.includes(doc.id) ? 'checked' : ''}
                      onchange="toggleDocumentSelection('${doc.id}', this.checked)"
                      class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      onclick="event.stopPropagation()"
                    />
                    <div class="p-2 bg-green-50 text-green-600 rounded-lg">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <span class="text-xs px-2 py-1 rounded bg-green-100 text-green-700">OneDrive</span>
                </div>

                <h4 class="font-semibold text-gray-800 mb-2">${doc.title}</h4>
                <p class="text-sm text-gray-600 mb-4 line-clamp-3">${doc.content || 'No preview available'}</p>

                <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>${formatDate(doc.created_at)}</span>
                  ${doc.updated_at ? `<span>Updated ${formatDate(doc.updated_at)}</span>` : ''}
                </div>

                <div class="flex items-center gap-2">
                  ${doc.webUrl ? `
                    <a
                      href="${doc.webUrl}"
                      target="_blank"
                      class="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm text-center"
                    >
                      Open in OneDrive
                    </a>
                  ` : `
                    <button
                      onclick="viewDocument('${doc.id}')"
                      class="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      View
                    </button>
                  `}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `}
    </div>
  `;
}

function updateDocumentSearch(query) {
  AppState.documentSearchQuery = query;
  renderDocuments();
}

function toggleDocumentSelection(docId, isChecked) {
  if (!AppState.selectedDocuments) {
    AppState.selectedDocuments = [];
  }

  if (isChecked) {
    if (!AppState.selectedDocuments.includes(docId)) {
      AppState.selectedDocuments.push(docId);
    }
  } else {
    AppState.selectedDocuments = AppState.selectedDocuments.filter(id => id !== docId);
  }

  renderDocuments();
}

function toggleSelectAllDocuments(isChecked) {
  const documents = AppState.documents;
  const searchQuery = AppState.documentSearchQuery || '';

  let filteredDocuments = documents;
  if (searchQuery) {
    filteredDocuments = filteredDocuments.filter(d =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (isChecked) {
    AppState.selectedDocuments = filteredDocuments.map(d => d.id);
  } else {
    AppState.selectedDocuments = [];
  }

  renderDocuments();
}

function clearDocumentSelection() {
  AppState.selectedDocuments = [];
  renderDocuments();
}

function bulkDownloadDocuments() {
  const selectedDocs = AppState.selectedDocuments || [];
  if (selectedDocs.length === 0) {
    alert('No documents selected');
    return;
  }

  const docs = AppState.documents.filter(d => selectedDocs.includes(d.id));
  alert(`Downloading ${docs.length} document${docs.length > 1 ? 's' : ''}...\n\n${docs.map(d => '• ' + d.title).join('\n')}`);

  // In a real app, this would trigger actual downloads
  console.log('Bulk download:', docs);
}

function bulkShareDocuments() {
  const selectedDocs = AppState.selectedDocuments || [];
  if (selectedDocs.length === 0) {
    alert('No documents selected');
    return;
  }

  const docs = AppState.documents.filter(d => selectedDocs.includes(d.id));
  const recipient = prompt(`Share ${docs.length} document${docs.length > 1 ? 's' : ''} with (email):`);

  if (recipient) {
    alert(`Sharing ${docs.length} document${docs.length > 1 ? 's' : ''} with ${recipient}...\n\n${docs.map(d => '• ' + d.title).join('\n')}`);
    console.log('Bulk share:', docs, 'to', recipient);
  }
}

function bulkDeleteDocuments() {
  const selectedDocs = AppState.selectedDocuments || [];
  if (selectedDocs.length === 0) {
    alert('No documents selected');
    return;
  }

  const docs = AppState.documents.filter(d => selectedDocs.includes(d.id));

  if (confirm(`Are you sure you want to delete ${docs.length} document${docs.length > 1 ? 's' : ''}?\n\n${docs.map(d => '• ' + d.title).join('\n')}`)) {
    AppState.documents = AppState.documents.filter(d => !selectedDocs.includes(d.id));
    AppState.selectedDocuments = [];
    renderDocuments();
    alert(`${docs.length} document${docs.length > 1 ? 's' : ''} deleted successfully`);
  }
}

function viewDocument(docId) {
  const doc = AppState.documents.find(d => d.id === docId);
  if (doc && doc.webUrl) {
    window.open(doc.webUrl, '_blank');
  } else {
    alert('Document URL not available');
  }
}

function showNewDocumentModal() {
  const modalHtml = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target === this) closeNewDocumentModal()">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 mx-4">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Create Document in OneDrive</h3>
          <p class="text-gray-600 mb-6">Documents are managed in Microsoft OneDrive. Click below to open OneDrive and create a new document.</p>

          <div class="space-y-3">
            <button
              onclick="openSharePointNewDocument()"
              class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
              <span>Open OneDrive</span>
            </button>

            <button
              type="button"
              onclick="closeNewDocumentModal()"
              class="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>

          <p class="text-xs text-gray-500 mt-4">After creating your document, click "Sync OneDrive" to see it here.</p>
        </div>
      </div>
    </div>
  `;

  const modalContainer = document.createElement('div');
  modalContainer.id = 'new-doc-modal';
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);
}

function closeNewDocumentModal() {
  const modal = document.getElementById('new-doc-modal');
  if (modal) {
    modal.remove();
  }
}

function openSharePointNewDocument() {
  // Open SharePoint in browser to create a new document
  const sharePointUrl = 'https://www.office.com/launch/sharepoint';

  // Open in external browser
  window.open(sharePointUrl, '_blank');

  closeNewDocumentModal();

  // Show a message to remind user to sync after creating
  setTimeout(() => {
    alert('After creating your document in SharePoint, click "Sync OneDrive" to see it in the app.');
  }, 500);
}

function openOneDriveNewDocument() {
  // Open OneDrive in browser to create a new document
  const oneDriveUrl = 'https://www.office.com/launch/onedrive';

  // Open in external browser
  window.open(oneDriveUrl, '_blank');

  closeNewDocumentModal();

  // Show a message to remind user to sync after creating
  setTimeout(() => {
    alert('After creating your document in OneDrive, click "Sync OneDrive" to see it in the app.');
  }, 500);
}

// ============================================
// SCHEDULING VIEW
// ============================================
function renderScheduling() {
  const content = document.getElementById('content');

  const pendingMessages = AppState.scheduledMessages.filter(m => m.status === 'pending');
  const sentMessages = AppState.scheduledMessages.filter(m => m.status === 'sent');

  content.innerHTML = `
    <div class="space-y-6">
      <!-- Header with Actions -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-2xl font-bold text-gray-800">Message Scheduling</h3>
          <p class="text-gray-600">Schedule and manage automated messages</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            onclick="AzureVMAPI.refreshSubscribedChats()"
            class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            title="Refresh subscribed chats from Azure VM"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Chats</span>
          </button>
          <button
            onclick="showModal('newMessage')"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Schedule Message</span>
          </button>
        </div>
      </div>

      <!-- Azure VM Connection Status -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 ${AppState.azureVmUrl ? 'bg-green-100' : 'bg-gray-100'} rounded-lg">
              <svg class="w-5 h-5 ${AppState.azureVmUrl ? 'text-green-600' : 'text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-800">Azure VM Connection</p>
              <p class="text-xs text-gray-600">
                ${AppState.azureVmUrl 
                  ? `Connected to: ${AppState.azureVmUrl}` 
                  : 'Not configured - Set Azure VM URL in Settings'}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold text-gray-800">${AppState.subscribedChats.length}</p>
            <p class="text-xs text-gray-600">Subscribed Chats</p>
          </div>
        </div>
      </div>

      <!-- Pending Messages -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <h4 class="font-semibold text-gray-800">Pending Messages (${pendingMessages.length})</h4>
        </div>
        <div class="p-6">
          ${pendingMessages.length === 0 ? `
            <div class="text-center py-8 text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 01-2 2z" />
              </svg>
              <p class="text-sm">No pending messages</p>
              <button
                onclick="showModal('newMessage')"
                class="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Schedule Your First Message
              </button>
            </div>
          ` : `
            <div class="space-y-3">
              ${pendingMessages.map(msg => `
                <div class="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div class="p-3 bg-orange-50 text-orange-600 rounded-lg">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between mb-2">
                      <div>
                        <p class="font-medium text-gray-800">To: ${msg.recipient}</p>
                        <p class="text-sm text-gray-600 capitalize">${msg.platform}</p>
                      </div>
                      <span class="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">Pending</span>
                    </div>
                    <p class="text-sm text-gray-700 mb-3">${msg.message_content}</p>
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2 text-xs text-gray-500">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 01-2 2z" />
                        </svg>
                        <span>Scheduled: ${formatDateTime(msg.scheduled_time)}</span>
                      </div>
                      <div class="flex gap-2">
                        <button
                          onclick="sendMessageNow('${msg.id}')"
                          class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          Send Now
                        </button>
                        <button
                          onclick="deleteMessage('${msg.id}')"
                          class="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>

      <!-- Sent Messages -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <h4 class="font-semibold text-gray-800">Sent Messages (${sentMessages.length})</h4>
        </div>
        <div class="p-6">
          ${sentMessages.length === 0 ? `
            <div class="text-center py-8 text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <p class="text-sm">No sent messages</p>
            </div>
          ` : `
            <div class="space-y-3">
              ${sentMessages.map(msg => `
                <div class="flex itemsstart gap-4 p-4 border border-gray-200 rounded-lg">
                  <div class="p-3 bg-green-50 text-green-600 rounded-lg">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between mb-2">
                      <div>
                        <p class="font-medium text-gray-800">To: ${msg.recipient}</p>
                        <p class="text-sm text-gray-600 capitalize">${msg.platform}</p>
                      </div>
                      <span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Sent</span>
                    </div>
                    <p class="text-sm text-gray-700 mb-3">${msg.message_content}</p>
                    <div class="flex items-center gap-2 text-xs text-gray-500">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Sent: ${formatDateTime(msg.sent_at || msg.scheduled_time)}</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function sendMessageNow(messageId) {
  const messageIndex = AppState.scheduledMessages.findIndex(m => m.id === messageId);
  if (messageIndex !== -1) {
    AppState.scheduledMessages[messageIndex].status = 'sent';
    AppState.scheduledMessages[messageIndex].sent_at = new Date().toISOString();
    renderScheduling();
    alert('Message sent successfully!');
  }
}

function deleteMessage(messageId) {
  if (!confirm('Are you sure you want to delete this scheduled message?')) {
    return;
  }
  AppState.scheduledMessages = AppState.scheduledMessages.filter(m => m.id !== messageId);
  renderScheduling();
}

// ============================================
// FORMS VIEW
// ============================================
function renderForms() {
  const content = document.getElementById('content');

  if (!AppState.isAuthenticated) {
    content.innerHTML = `
      <div class="space-y-6">
        <div>
          <h3 class="text-2xl font-bold text-gray-800">Microsoft Forms</h3>
          <p class="text-gray-600">Create forms and view responses</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Connect to Microsoft 365</h3>
          <p class="text-gray-600 mb-4">Sign in to access your Microsoft Forms</p>
          <button
            onclick="MicrosoftGraphAPI.authenticateWithMicrosoft()"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign in with Microsoft
          </button>
        </div>
      </div>
    `;
    return;
  }

  const forms = AppState.microsoftForms;

  content.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-2xl font-bold text-gray-800">Microsoft Forms</h3>
          <p class="text-gray-600">Manage your forms and view responses</p>
        </div>
        <div class="flex gap-2">
          <button
            onclick="refreshForms()"
            class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Forms</span>
          </button>
          <button
            onclick="showNewFormModal()"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Form</span>
          </button>
        </div>
      </div>

      ${forms.length === 0 ? `
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 class="text-xl font-semibold text-gray-800 mb-2">No forms found</h3>
          <p class="text-gray-600 mb-4">Refresh to load forms or create your first form in Microsoft Forms</p>
          <button
            onclick="refreshForms()"
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Refresh Forms
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${forms.map(form => `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between mb-3">
                <div class="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </div>
                <span class="text-xs px-2 py-1 rounded ${form.isAcceptingResponses ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}">
                  ${form.isAcceptingResponses ? 'Active' : 'Closed'}
                </span>
              </div>

              <h4 class="font-semibold text-gray-800 mb-2">${form.title}</h4>
              <p class="text-sm text-gray-600 mb-4 line-clamp-2">${form.description}</p>

              <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
                <div class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
                  </svg>
                  <span>${form.responseCount} responses</span>
                </div>
                <span>${formatDate(form.createdDateTime)}</span>
              </div>

              <div class="flex items-center gap-2">
                <button
                  onclick="viewFormResponses('${form.id}')"
                  class="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  View Responses
                </button>
                <button
                  onclick="window.open('${form.webUrl}', '_blank')"
                  class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  title="Open Form"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

async function refreshForms() {
  if (!AppState.isAuthenticated) {
    alert('Please sign in with Microsoft 365 first.');
    return;
  }

  alert('Refreshing Microsoft Forms...');

  // Reload forms from Microsoft Graph API
  AppState.microsoftForms = await MicrosoftGraphAPI.getForms();

  // Re-render the forms view
  renderForms();
}

function showNewFormModal() {
  const modalHtml = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target === this) closeNewFormModal()">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 mx-4">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
            <svg class="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Create Form in Microsoft Forms</h3>
          <p class="text-gray-600 mb-6">Forms are managed in Microsoft Forms. Click below to open Microsoft Forms and create a new form.</p>

          <div class="space-y-3">
            <button
              onclick="openMicrosoftForms()"
              class="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
              <span>Open Microsoft Forms</span>
            </button>

            <button
              type="button"
              onclick="closeNewFormModal()"
              class="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>

          <p class="text-xs text-gray-500 mt-4">After creating your form, click "Refresh Forms" to see it here.</p>
        </div>
      </div>
    </div>
  `;

  const modalContainer = document.createElement('div');
  modalContainer.id = 'new-form-modal';
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);
}

function closeNewFormModal() {
  const modal = document.getElementById('new-form-modal');
  if (modal) {
    modal.remove();
  }
}

function openMicrosoftForms() {
  // Open Microsoft Forms in browser to create a new form
  const formsUrl = 'https://forms.office.com';

  // Open in external browser
  window.open(formsUrl, '_blank');

  closeNewFormModal();

  // Show a message to remind user to refresh after creating
  setTimeout(() => {
    alert('After creating your form in Microsoft Forms, click "Refresh Forms" to see it here.');
  }, 500);
}

async function viewFormResponses(formId) {
  const form = AppState.microsoftForms.find(f => f.id === formId);
  if (!form) return;

  // Get responses for this form
  const responses = await MicrosoftGraphAPI.getFormResponses(formId);

  const modalHtml = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target === this) closeResponsesModal()">
      <div class="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden mx-4">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-semibold text-gray-800">${form.title}</h3>
              <p class="text-sm text-gray-600">${responses.length} responses</p>
            </div>
            <button
              onclick="closeResponsesModal()"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>
          </div>
        </div>

        <div class="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          ${responses.length === 0 ? `
            <div class="text-center py-12 text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 01-2 2z" />
              </svg>
              <p class="text-sm">No responses yet</p>
            </div>
          ` : `
            <div class="space-y-4">
              ${responses.map((response, index) => `
                <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-medium text-gray-700">Response #${index + 1}</span>
                    <div class="text-xs text-gray-500">
                      <span>${response.submitter}</span>
                      <span class="mx-2">•</span>
                      <span>${formatDateTime(response.submittedDateTime)}</span>
                    </div>
                  </div>
                  <div class="space-y-2">
                    ${Object.entries(response.responses).map(([question, answer]) => `
                      <div class="bg-white p-3 rounded border border-gray-100">
                        <p class="text-sm font-medium text-gray-700 mb-1">${question}</p>
                        <p class="text-sm text-gray-600">${answer}</p>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  const modalContainer = document.createElement('div');
  modalContainer.id = 'responses-modal';
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);
}

function closeResponsesModal() {
  const modal = document.getElementById('responses-modal');
  if (modal) {
    modal.remove();
  }
}

// ============================================
// SETTINGS VIEW
// ============================================
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

          <!-- Azure VM Integration -->
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-6">
            <div class="flex items-start gap-3 mb-4">
              <div class="p-2 bg-blue-600 rounded-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-800">Azure VM Integration</h3>
                <p class="text-sm text-gray-600 mt-1">Connect to your Azure VM to fetch subscribed chat IDs for scheduling</p>
              </div>
            </div>

            <div class="space-y-4">
              <!-- Azure VM URL Configuration -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Azure VM URL
                  <span id="azure-vm-connection-status" class="ml-2 text-xs"></span>
                </label>
                <div class="relative">
                  <input
                    type="url"
                    id="azure-vm-url-input"
                    value="${AppState.azureVmUrl}"
                    placeholder="https://your-azure-vm.com"
                    oninput="handleAzureVmUrlChange()"
                    onpaste="handleAzureVmUrlPaste(event)"
                    class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <div id="azure-vm-url-loading" class="hidden absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg class="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </div>
                <p class="text-xs mt-1" id="azure-vm-url-hint">
                  <span class="text-blue-600 font-medium">💡 Just paste your URL</span> - it will auto-save and connect immediately
                </p>
              </div>

              <!-- Connection Stats -->
              ${AppState.azureVmUrl ? `
                <div class="bg-white rounded-lg p-4 border border-blue-200">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-700">Connection Status</span>
                    <button
                      onclick="testAzureVmConnection()"
                      class="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Test Connection
                    </button>
                  </div>
                  <div class="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p class="text-xs text-gray-500">Subscribed Chats</p>
                      <p class="text-lg font-semibold text-gray-800">${AppState.subscribedChats.length}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">Status</p>
                      <p class="text-sm font-medium text-green-600">✓ Configured</p>
                    </div>
                  </div>
                </div>
              ` : `
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div class="flex gap-3">
                    <svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p class="text-sm font-medium text-yellow-800">Not Connected</p>
                      <p class="text-xs text-yellow-700 mt-1">Paste your Azure VM URL above to enable chat scheduling features</p>
                    </div>
                  </div>
                </div>
              `}
            </div>
          </div>

          <!-- Application Settings -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Application Settings</h3>
            <div class="space-y-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <select
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light" selected>Light</option>
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
              <p class="text-xs text-center text-gray-500">Azure VM URL auto-saves when you paste or type</p>
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
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Azure VM</span>
                <span class="flex items-center gap-1 text-xs ${AppState.azureVmUrl ? 'text-green-600' : 'text-gray-400'}">
                  <div class="w-2 h-2 rounded-full ${AppState.azureVmUrl ? 'bg-green-600' : 'bg-gray-400'}"></div>
                  ${AppState.azureVmUrl ? 'Configured' : 'Not Configured'}
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
}

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

function closeWhatsAppModal() {
  const modal = document.getElementById('whatsapp-modal');
  if (modal) {
    modal.remove();
  }
}

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

function disconnectWhatsApp() {
  if (confirm('Are you sure you want to disconnect WhatsApp?')) {
    AppState.whatsappConnected = false;
    AppState.whatsappPhone = '';
    AppState.whatsappApiKey = '';
    renderSettings();
  }
}

function disconnectGoogleDrive() {
  if (confirm('Are you sure you want to disconnect Google Drive?')) {
    GoogleDriveAPI.logout();
    renderSettings();
  }
}

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

// Handle Azure VM URL changes with auto-save
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

// Handle paste event for immediate connection
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

// Auto-save Azure VM URL and attempt connection
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

// Update Azure VM URL status indicator
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

// Test Azure VM connection manually
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

// ============================================
// HELP & GUIDANCE
// ============================================
function showHelpGuide() {
  const modalHtml = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target === this) closeHelpGuide()">
      <div class="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div class="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-3 bg-white bg-opacity-20 rounded-lg">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </div>
              <div>
                <h3 class="text-2xl font-bold text-white">Quick Start Guide</h3>
                <p class="text-blue-100 text-sm">Everything you need to get started</p>
              </div>
            </div>
            <button onclick="closeHelpGuide()" class="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>
          </div>
        </div>

        <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div class="space-y-6">
            <!-- Welcome Section -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 class="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Welcome to Community Curator!
              </h4>
              <p class="text-sm text-blue-800">
                This platform helps you manage documents, schedule messages, and collect responses from your community all in one place.
              </p>
            </div>

            <!-- Key Features -->
            <div>
              <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Key Features
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div class="flex items-start gap-3">
                    <div class="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </div>
                    <div>
                      <h5 class="font-medium text-gray-800 mb-1">Documents</h5>
                      <p class="text-sm text-gray-600">Sync and manage SharePoint documents with search and filtering.</p>
                    </div>
                  </div>
                </div>

                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div class="flex items-start gap-3">
                    <div class="p-2 bg-green-50 rounded-lg flex-shrink-0">
                      <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h6M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12" />
                    </div>
                    <div>
                      <h5 class="font-medium text-gray-800 mb-1">Message Scheduling</h5>
                      <p class="text-sm text-gray-600">Schedule WhatsApp, SMS, and email messages to your community.</p>
                    </div>
                  </div>
                </div>

                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div class="flex items-start gap-3">
                    <div class="p-2 bg-purple-50 rounded-lg flex-shrink-0">
                      <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </div>
                    <div>
                      <h5 class="font-medium text-gray-800 mb-1">Microsoft Forms</h5>
                      <p class="text-sm text-gray-600">Create surveys and collect responses from community members.</p>
                    </div>
                  </div>
                </div>

                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div class="flex items-start gap-3">
                    <div class="p-2 bg-orange-50 rounded-lg flex-shrink-0">
                      <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0v-6" />
                    </div>
                    <div>
                      <h5 class="font-medium text-gray-800 mb-1">Dashboard</h5>
                      <p class="text-sm text-gray-600">Get an overview of all activities and upcoming tasks at a glance.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Getting Started Steps -->
            <div>
              <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Getting Started (3 Easy Steps)
              </h4>
              <div class="space-y-3">
                <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <h5 class="font-medium text-gray-800 mb-1">Connect to Microsoft 365</h5>
                    <p class="text-sm text-gray-600 mb-2">Sign in with your Microsoft account to access SharePoint documents and Forms.</p>
                    <button onclick="closeHelpGuide(); navigateTo('settings');" class="text-sm text-blue-600 hover:text-blue-700 font-medium">Go to Settings →</button>
                  </div>
                </div>

                <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <h5 class="font-medium text-gray-800 mb-1">Connect WhatsApp (Optional)</h5>
                    <p class="text-sm text-gray-600 mb-2">Link your WhatsApp Business account to start scheduling messages.</p>
                    <button onclick="closeHelpGuide(); navigateTo('settings');" class="text-sm text-blue-600 hover:text-blue-700 font-medium">Go to Settings →</button>
                  </div>
                </div>

                <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <h5 class="font-medium text-gray-800 mb-1">Start Using Features</h5>
                    <p class="text-sm text-gray-600">Explore the dashboard, sync documents, schedule messages, or create forms!</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tips & Tricks -->
            <div>
              <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Quick Tips
              </h4>
              <div class="space-y-2">
                <div class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <p class="text-sm text-gray-600">Use the <strong>Search</strong> and <strong>Filter</strong> options to quickly find documents and forms</p>
                </div>
                <div class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <p class="text-sm text-gray-600">Click <strong>"Sync OneDrive"</strong> to refresh your documents from Microsoft 365</p>
                </div>
                <div class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <p class="text-sm text-gray-600">Schedule messages in advance to automate your community communications</p>
                </div>
                <div class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <p class="text-sm text-gray-600">View form responses in real-time to track community feedback</p>
                </div>
              </div>
            </div>

            <!-- Need More Help -->
            <div class="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <h4 class="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Need More Help?
              </h4>
              <p class="text-sm text-purple-800 mb-3">
                Access the Help button (?) in the top-right corner anytime to view this guide again.
              </p>
              <div class="flex gap-2">
                <a href="https://github.com/yourusername/community-curator" target="_blank" class="text-sm text-purple-700 hover:text-purple-900 font-medium flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Documentation
                </a>
                <span class="text-purple-300">•</span>
                <a href="#" onclick="alert('Contact support: support@communitycurator.org')" class="text-sm text-purple-700 hover:text-purple-900 font-medium">Contact Support</a>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button onclick="closeHelpGuide()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  `;

  const modalContainer = document.createElement('div');
  modalContainer.id = 'help-guide-modal';
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);
}

function closeHelpGuide() {
  const modal = document.getElementById('help-guide-modal');
  if (modal) {
    modal.remove();
  }
}

// Make help functions globally accessible
window.showHelpGuide = showHelpGuide;
window.closeHelpGuide = closeHelpGuide;

// Make GoogleDriveAPI globally accessible
window.GoogleDriveAPI = GoogleDriveAPI;

// ============================================
// INITIALIZE APP
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('App initializing...');

  // Check for existing authentication
  await MicrosoftGraphAPI.checkAuthentication();

  // Initialize subscribed chats from Azure VM
  await initializeSubscribedChats();

  // Setup auth event listeners
  window.electronAPI.onAuthSuccess(() => {
    console.log('Authentication successful!');
    MicrosoftGraphAPI.checkAuthentication();
  });

  window.electronAPI.onAuthError((error) => {
    console.error('Authentication error:', error);
    showNotification('Authentication failed: ' + error, 'error');
  });

  // Add some sample data for demonstration
  AppState.scheduledMessages.push({
    id: generateId(),
    platform: 'whatsapp',
    recipient: '+1234567890',
    scheduled_time: new Date(Date.now() + 86400000).toISOString(),
    message_content: 'Hello! This is a test scheduled message.',
    status: 'pending',
    created_at: new Date().toISOString(),
    sent_at: null,
    error_message: null,
    user_id: 'local-user'
  });

  AppState.documents.push({
    id: generateId(),
    title: 'Welcome Document',
    content: 'This is a sample document to get you started.',
    source: 'local',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'local-user'
  });

  // Load Microsoft Forms (simulated for demo)
  AppState.microsoftForms = await MicrosoftGraphAPI.getForms();

  console.log('App initialized, rendering...');

  // Render the app
  renderApp();
});

// ============================================
// NOTIFICATION SYSTEM
// ============================================
function showNotification(message, type = 'info') {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  };

  const color = colors[type] || colors.info;

  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 ${color} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('animate-fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============================================
// REFRESH SHAREPOINT DOCUMENTS
// ============================================
async function refreshSharePointDocs() {
  if (!AppState.isAuthenticated) {
    showNotification('Please sign in with Microsoft 365 first', 'warning');
    return;
  }

  showNotification('Syncing SharePoint documents...', 'info');

  try {
    const files = await MicrosoftGraphAPI.getOneDriveFiles();
    AppState.documents = files;
    renderDocuments();
    showNotification(`Synced ${files.length} documents from SharePoint`, 'success');
  } catch (error) {
    console.error('Error syncing SharePoint:', error);
    showNotification('Failed to sync SharePoint documents', 'error');
  }
}

