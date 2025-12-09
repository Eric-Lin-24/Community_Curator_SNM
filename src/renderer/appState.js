// Application state management

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
  azureVmUrl: 'http://20.153.191.11:8000', // Azure VM URL (hardcoded)
  loadingSubscribedChats: false
};
