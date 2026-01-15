// ============================================
// APPLICATION STATE MANAGEMENT
// Central state object for the application
// ============================================

const AppState = {
  // Current view
  currentView: 'dashboard',

  // Documents
  documents: [],
  activeDocumentSource: 'onedrive', // 'onedrive' or 'googledrive'
  documentSearchQuery: '',
  // Folder navigation per provider
  documentNav: {
    onedrive: { folderId: 'root', stack: [] },
    googledrive: { folderId: 'root', stack: [] }
  },
  // Last successful sync times (used by Dashboard + Documents)
  lastSync: {
    onedrive: null,
    googledrive: null,
    subscribedChats: null
  },

  // Messaging
  scheduledMessages: [],
  subscribedChats: [],
  loadingSubscribedChats: false,

  // Forms
  microsoftForms: [],
  formSubmissions: [],
  selectedForm: null,

  // Microsoft Authentication
  isAuthenticated: false,
  accessToken: null,
  userProfile: null,

  // Google Drive
  googleDriveConnected: false,
  googleDriveEmail: '',

  // WhatsApp / Azure VM
  whatsappConnected: false,
  whatsappPhone: '',
  azureVmUrl: 'http://20.153.191.11:8000',

  // Templates
  templates: [],

  // Connections
  connections: []
};

// Export to global scope
if (typeof window !== 'undefined') {
  window.AppState = AppState;
}
