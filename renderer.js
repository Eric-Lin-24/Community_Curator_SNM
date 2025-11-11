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
  whatsappPhone: ''
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
// MICROSOFT GRAPH API
// ============================================
const MicrosoftGraphAPI = {
  baseUrl: 'https://graph.microsoft.com/v1.0',

  async authenticateWithMicrosoft() {
    console.log('Microsoft authentication would be triggered here');
    alert('Microsoft authentication will be implemented with MSAL library. You will sign in with your Microsoft 365 account.');

    AppState.isAuthenticated = true;
    AppState.userProfile = {
      name: 'Demo User',
      email: 'user@organization.com'
    };

    renderApp();
  },

  async getForms() {
    if (!AppState.isAuthenticated) {
      console.log('Not authenticated');
      return [];
    }

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
// ACTION HANDLERS (Stub functions for buttons)
// ============================================
function refreshSharePointDocs() {
  alert('Refreshing SharePoint documents...');
}

function showModal(type) {
  let modalHtml = '';

  switch(type) {
    case 'newMessage':
      modalHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target === this) hideModal()">
          <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 mx-4">
            <h3 class="text-xl font-semibold mb-4">Schedule Message</h3>
            <form onsubmit="scheduleMessage(event)">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Messaging Platform</label>
                <select
                  id="msg-platform"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="whatsapp" selected>WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="telegram">Telegram</option>
                  <option value="email">Email</option>
                </select>
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

function scheduleMessage(event) {
  event.preventDefault();

  const platform = document.getElementById('msg-platform').value;
  const recipient = document.getElementById('msg-recipient').value;
  const content = document.getElementById('msg-content').value;
  const scheduledTime = document.getElementById('msg-schedule').value;

  const newMessage = {
    id: generateId(),
    platform: platform,
    recipient: recipient,
    content: content,
    message_content: content,
    scheduled_time: scheduledTime,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  AppState.scheduledMessages.push(newMessage);
  hideModal();
  renderScheduling();
  alert(`Message scheduled successfully via ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`);
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
    documents: { title: 'Documents', subtitle: 'Manage and sync your SharePoint documents' },
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
  if (!AppState.isAuthenticated) {
    content.innerHTML = `
      <div class="space-y-6">
        <div>
          <h3 class="text-2xl font-bold text-gray-800">Documents</h3>
          <p class="text-gray-600">Access your SharePoint documents</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Connect to Microsoft 365</h3>
          <p class="text-gray-600 mb-4">Sign in to access your SharePoint documents</p>
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

  const documents = AppState.documents;
  const searchQuery = AppState.documentSearchQuery || '';
  const selectedDocs = AppState.selectedDocuments || [];

  // Filter documents
  let filteredDocuments = documents;
  if (searchQuery) {
    filteredDocuments = filteredDocuments.filter(d =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  content.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-2xl font-bold text-gray-800">SharePoint Documents</h3>
          <p class="text-gray-600">Your documents synced from SharePoint</p>
        </div>
        <div class="flex gap-2">
          <button
            onclick="refreshSharePointDocs()"
            class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Sync SharePoint</span>
          </button>
          <button
            onclick="showNewDocumentModal()"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          <p class="text-gray-600 mb-4">Sync your SharePoint to see documents here</p>
          <button
            onclick="refreshSharePointDocs()"
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Sync SharePoint
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
                  <span class="text-xs px-2 py-1 rounded bg-green-100 text-green-700">SharePoint</span>
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
                      Open in SharePoint
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
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Create Document in SharePoint</h3>
          <p class="text-gray-600 mb-6">Documents are managed in Microsoft SharePoint. Click below to open SharePoint and create a new document.</p>

          <div class="space-y-3">
            <button
              onclick="openSharePointNewDocument()"
              class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
              <span>Open SharePoint</span>
            </button>

            <button
              onclick="openOneDriveNewDocument()"
              class="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
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

          <p class="text-xs text-gray-500 mt-4">After creating your document, click "Sync SharePoint" to see it here.</p>
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
    alert('After creating your document in SharePoint, click "Sync SharePoint" to see it in the app.');
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
    alert('After creating your document in OneDrive, click "Sync SharePoint" to see it in the app.');
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
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-2xl font-bold text-gray-800">Message Scheduling</h3>
          <p class="text-gray-600">Schedule and manage automated messages</p>
        </div>
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

      <!-- Pending Messages -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <h4 class="font-semibold text-gray-800">Pending Messages (${pendingMessages.length})</h4>
        </div>
        <div class="p-6">
          ${pendingMessages.length === 0 ? `
            <div class="text-center py-8 text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
                <div class="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414A1 1 0 006.586 13H4" />
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
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7  0 00-7 7h14a7 7 0 00-7-7z" />
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

          <!-- Application Settings -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Application Settings</h3>
            <div class="space-y-4">
              <div>
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
                onclick="alert('Settings saved!')"
                class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Settings
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
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h6M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 01-2 2z" />
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
                  <p class="text-sm text-gray-600">Click <strong>"Sync SharePoint"</strong> to refresh your documents from Microsoft 365</p>
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

// ============================================
// INITIALIZE APP
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('App initializing...');

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
