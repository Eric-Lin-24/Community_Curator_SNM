// ============================================
// DASHBOARD VIEW
// ============================================

/**
 * Create a stat card component
 * @param {string} title - Card title
 * @param {number} value - Numeric value to display
 * @param {string} subtitle - Subtitle text
 * @param {string} color - Color theme (blue, green, orange, purple)
 * @param {string} icon - SVG icon markup
 * @returns {string} HTML string for the stat card
 */
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

/**
 * Render the dashboard view
 * Shows overview statistics, upcoming scheduled messages, and recent documents
 */
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
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Create document collections to organize content</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Schedule WhatsApp messages for your community</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Use Microsoft Forms to collect data from members</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
