// Community Curator - Main Application Logic

// State Management
const AppState = {
  currentView: 'dashboard',
  documents: [],
  scheduledMessages: [],
  forms: [],
  formSubmissions: [],
  connections: [],
  templates: []
};

// Utility Functions
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

// Navigation
function navigateTo(view) {
  AppState.currentView = view;
  renderApp();
}

// Render Functions
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

  // Update header
  const titles = {
    dashboard: { title: 'Dashboard', subtitle: 'Overview of your community management platform' },
    documents: { title: 'Document Management', subtitle: 'Manage your document collections and schedule messages' },
    scheduling: { title: 'Message Scheduling', subtitle: 'Schedule WhatsApp messages for delivery' },
    forms: { title: 'Forms Management', subtitle: 'Create and manage data collection forms' },
    responses: { title: 'Form Responses', subtitle: 'View and export form submissions' },
    sharepoint: { title: 'SharePoint Integration', subtitle: 'Connect to SharePoint to sync documents' },
    settings: { title: 'Settings', subtitle: 'Manage your application settings and integrations' }
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
    case 'responses':
      renderResponses();
      break;
    case 'sharepoint':
      renderSharePoint();
      break;
    case 'settings':
      renderSettings();
      break;
    default:
      renderDashboard();
  }
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        `)}
        ${createStatCard('Form Responses', AppState.formSubmissions.length, 'Total submissions', 'purple', `
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
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                        <span class="capitalize">${doc.source}</span>
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
            <h4 class="text-xl font-semibold mb-2">Getting Started</h4>
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
                <span>Build forms to collect data from members</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Connect to SharePoint for document syncing</span>
              </li>
            </ul>
          </div>
          <div class="p-4 bg-white bg-opacity-20 rounded-lg">
            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  `;
}

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

function renderDocuments() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="text-xl font-semibold text-gray-800 mb-2">Document Management</h3>
      <p class="text-gray-600 mb-4">Organize and manage your document collections</p>
      <button onclick="showModal('newDocument')" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Create Collection
      </button>
    </div>
  `;
}

function renderScheduling() {
  const content = document.getElementById('content');

  const messages = AppState.scheduledMessages;
  const statusConfig = {
    pending: { icon: '⏰', color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
    sent: { icon: '✓', color: 'text-green-600', bg: 'bg-green-50', label: 'Sent' },
    failed: { icon: '✗', color: 'text-red-600', bg: 'bg-red-50', label: 'Failed' },
    cancelled: { icon: '⊗', color: 'text-gray-600', bg: 'bg-gray-50', label: 'Cancelled' }
  };

  content.innerHTML = `
    <div class="space-y-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-xl font-semibold text-gray-800">Scheduled Messages</h3>
            <p class="text-sm text-gray-600">Manage your WhatsApp message schedule</p>
          </div>
          <button onclick="showModal('newMessage')" class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Schedule Message</span>
          </button>
        </div>

        <div class="flex gap-2">
          ${['all', 'pending', 'sent', 'failed'].map(status => `
            <button class="px-3 py-1 rounded-lg transition-colors capitalize text-sm ${status === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
              ${status} (${status === 'all' ? messages.length : messages.filter(m => m.status === status).length})
            </button>
          `).join('')}
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        ${messages.length === 0 ? `
          <div class="p-12 text-center text-gray-500">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p class="text-lg font-medium">No scheduled messages</p>
            <p class="text-sm">Create your first scheduled message to get started</p>
          </div>
        ` : `
          <div class="divide-y divide-gray-200">
            ${messages.map(msg => {
              const config = statusConfig[msg.status];
              return `
                <div class="p-6 hover:bg-gray-50 transition-colors">
                  <div class="flex items-start gap-4">
                    <div class="p-3 rounded-lg ${config.bg}">
                      <span class="text-2xl">${config.icon}</span>
                    </div>
                    <div class="flex-1">
                      <h4 class="font-semibold text-gray-800 mb-1">To: ${msg.recipient}</h4>
                      <div class="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span>${msg.platform}</span>
                        <span>•</span>
                        <span>${formatDate(msg.scheduled_time)}</span>
                        <span>•</span>
                        <span>${formatTime(msg.scheduled_time)}</span>
                      </div>
                      <p class="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">${msg.message_content}</p>
                      ${msg.sent_at ? `<p class="text-xs text-gray-500 mt-2">Sent at: ${formatDateTime(msg.sent_at)}</p>` : ''}
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}">${config.label}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

function renderForms() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="text-xl font-semibold text-gray-800 mb-2">Forms Management</h3>
      <p class="text-gray-600 mb-4">Create custom forms to collect data from your community</p>
      <button onclick="showModal('newForm')" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Create Form
      </button>
    </div>
  `;
}

function renderResponses() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <h3 class="text-xl font-semibold text-gray-800 mb-2">Form Responses</h3>
      <p class="text-gray-600">View and export form submissions from your community</p>
    </div>
  `;
}

function renderSharePoint() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      <h3 class="text-xl font-semibold text-gray-800 mb-2">SharePoint Integration</h3>
      <p class="text-gray-600 mb-4">Connect to SharePoint to sync documents automatically</p>
      <button onclick="showModal('newConnection')" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Add Connection
      </button>
    </div>
  `;
}

function renderSettings() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h3 class="text-xl font-semibold text-gray-800 mb-6">Application Settings</h3>

      <div class="space-y-6">
        <div>
          <h4 class="font-semibold text-gray-700 mb-3">Messaging Platforms</h4>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h5 class="font-medium text-gray-800">WhatsApp Business API</h5>
                <p class="text-sm text-gray-600">Configure WhatsApp messaging</p>
              </div>
              <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Configure
              </button>
            </div>
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h5 class="font-medium text-gray-800">Telegram Bot API</h5>
                <p class="text-sm text-gray-600">Configure Telegram messaging</p>
              </div>
              <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Setup
              </button>
            </div>
          </div>
        </div>

        <div>
          <h4 class="font-semibold text-gray-700 mb-3">Data & Storage</h4>
          <div class="p-4 border border-gray-200 rounded-lg">
            <p class="text-sm text-gray-600">All data is stored locally on your device</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Modal Functions
function showModal(type) {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');

  let content = '';

  switch(type) {
    case 'newMessage':
      content = createNewMessageModal();
      break;
    case 'newDocument':
      content = createNewDocumentModal();
      break;
    case 'newForm':
      content = createNewFormModal();
      break;
    case 'newConnection':
      content = createNewConnectionModal();
      break;
  }

  modalContent.innerHTML = content;
  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

function createNewMessageModal() {
  return `
    <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
      <h3 class="text-xl font-semibold mb-4">Schedule New Message</h3>
      <form onsubmit="saveNewMessage(event)">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Platform</label>
          <select id="platform" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Recipient</label>
          <input type="text" id="recipient" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Phone number or username" required />
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input type="date" id="scheduleDate" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Time</label>
            <input type="time" id="scheduleTime" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Message</label>
          <textarea id="messageContent" class="w-full px-4 py-2 border border-gray-300 rounded-lg h-32 resize-none" placeholder="Type your message..." required></textarea>
        </div>
        <div class="flex gap-3 justify-end">
          <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Schedule Message</button>
        </div>
      </form>
    </div>
  `;
}

function createNewDocumentModal() {
  return `
    <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
      <h3 class="text-xl font-semibold mb-4">New Document Collection</h3>
      <form onsubmit="saveNewDocument(event)">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Collection Name</label>
          <input type="text" id="collectionName" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Marketing Materials" required />
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea id="collectionDesc" class="w-full px-4 py-2 border border-gray-300 rounded-lg h-24 resize-none" placeholder="Optional description..."></textarea>
        </div>
        <div class="flex gap-3 justify-end">
          <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Create Collection</button>
        </div>
      </form>
    </div>
  `;
}

function createNewFormModal() {
  return `
    <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
      <h3 class="text-xl font-semibold mb-4">Create New Form</h3>
      <form onsubmit="saveNewForm(event)">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Form Name</label>
          <input type="text" id="formName" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Contact Information" required />
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea id="formDesc" class="w-full px-4 py-2 border border-gray-300 rounded-lg h-20 resize-none" placeholder="Optional description..."></textarea>
        </div>
        <div class="flex gap-3 justify-end">
          <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Create Form</button>
        </div>
      </form>
    </div>
  `;
}

function createNewConnectionModal() {
  return `
    <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
      <h3 class="text-xl font-semibold mb-4">New SharePoint Connection</h3>
      <form onsubmit="saveNewConnection(event)">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Connection Name</label>
          <input type="text" id="connectionName" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Main Site" required />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Site URL</label>
          <input type="url" id="siteUrl" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="https://yoursite.sharepoint.com" required />
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Folder Path</label>
          <input type="text" id="folderPath" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="/Shared Documents" />
        </div>
        <div class="flex gap-3 justify-end">
          <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Create Connection</button>
        </div>
      </form>
    </div>
  `;
}

// Save Functions
function saveNewMessage(event) {
  event.preventDefault();

  const platform = document.getElementById('platform').value;
  const recipient = document.getElementById('recipient').value;
  const date = document.getElementById('scheduleDate').value;
  const time = document.getElementById('scheduleTime').value;
  const content = document.getElementById('messageContent').value;

  const message = {
    id: generateId(),
    platform,
    recipient,
    scheduled_time: new Date(`${date}T${time}`).toISOString(),
    message_content: content,
    status: 'pending',
    created_at: new Date().toISOString(),
    sent_at: null,
    error_message: null,
    user_id: 'local-user'
  };

  AppState.scheduledMessages.push(message);
  closeModal();
  navigateTo('scheduling');
}

function saveNewDocument(event) {
  event.preventDefault();
  closeModal();
  navigateTo('documents');
}

function saveNewForm(event) {
  event.preventDefault();
  closeModal();
  navigateTo('forms');
}

function saveNewConnection(event) {
  event.preventDefault();

  const name = document.getElementById('connectionName').value;
  const siteUrl = document.getElementById('siteUrl').value;
  const folderPath = document.getElementById('folderPath').value;

  const connection = {
    id: generateId(),
    name,
    site_url: siteUrl,
    folder_path: folderPath,
    sync_enabled: true,
    last_sync: null,
    created_at: new Date().toISOString(),
    user_id: 'local-user'
  };

  AppState.connections.push(connection);
  closeModal();
  navigateTo('sharepoint');
}

// Sidebar Toggle
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('hidden');
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  renderApp();

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

  renderApp();
});
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webPreferences.devTools = true;
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    app.quit();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

