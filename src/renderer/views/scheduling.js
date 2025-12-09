// ============================================
// SCHEDULING VIEW
// ============================================

/**
 * Render the scheduling view
 * Shows pending and sent scheduled messages
 */
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
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
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

/**
 * Send a scheduled message immediately
 * @param {string} messageId - Message ID
 */
function sendMessageNow(messageId) {
  const messageIndex = AppState.scheduledMessages.findIndex(m => m.id === messageId);
  if (messageIndex !== -1) {
    AppState.scheduledMessages[messageIndex].status = 'sent';
    AppState.scheduledMessages[messageIndex].sent_at = new Date().toISOString();
    renderScheduling();
    alert('Message sent successfully!');
  }
}

/**
 * Delete a scheduled message
 * @param {string} messageId - Message ID
 */
function deleteMessage(messageId) {
  if (!confirm('Are you sure you want to delete this scheduled message?')) {
    return;
  }
  AppState.scheduledMessages = AppState.scheduledMessages.filter(m => m.id !== messageId);
  renderScheduling();
}
