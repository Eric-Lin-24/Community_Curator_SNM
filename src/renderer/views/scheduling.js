// ============================================
// SCHEDULING VIEW
// ============================================

function _draftStorageKey() {
  // user-scoped drafts
  return AppState.userId ? `message_drafts_${AppState.userId}` : 'message_drafts_guest';
}

function loadMessageDrafts() {
  try {
    const raw = localStorage.getItem(_draftStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    AppState.messageDrafts = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to load drafts:', e);
    AppState.messageDrafts = [];
  }
}

function saveMessageDrafts() {
  try {
    localStorage.setItem(_draftStorageKey(), JSON.stringify(AppState.messageDrafts || []));
  } catch (e) {
    console.warn('Failed to save drafts:', e);
  }
}

function setSchedulingTab(tab) {
  AppState.schedulingActiveTab = tab;
  renderScheduling();
}

function getRecipientNameByUserId(userId) {
  const chat = (AppState.subscribedChats || []).find(c => String(c.user_id) === String(userId));
  return chat?.name || userId || 'Unknown';
}

function saveQuickDraft() {
  const recipient = document.getElementById('quick-recipient')?.value || '';
  const message = document.getElementById('quick-message')?.value || '';

  if (!recipient) { showNotification('Please select a recipient', 'warning'); return; }
  if (!message.trim()) { showNotification('Please enter a message to save', 'warning'); return; }

  loadMessageDrafts();

  const draft = {
    id: generateId(),
    target_user_id: recipient,
    message_content: message,
    created_at: new Date().toISOString()
  };

  AppState.messageDrafts.unshift(draft);
  saveMessageDrafts();

  showNotification('Draft saved', 'success');

  // optional: clear the quick message box (keeps recipient)
  document.getElementById('quick-message').value = '';
  renderScheduling();
}

function deleteDraft(draftId) {
  loadMessageDrafts();
  AppState.messageDrafts = (AppState.messageDrafts || []).filter(d => d.id !== draftId);
  saveMessageDrafts();
  showNotification('Draft deleted', 'success');
  renderScheduling();
}

function openDraft(draftId) {
  loadMessageDrafts();
  const draft = (AppState.messageDrafts || []).find(d => d.id === draftId);
  if (!draft) {
    showNotification('Draft not found', 'error');
    return;
  }

  AppState.scheduleMessagePrefill = {
    target_user_id: draft.target_user_id,
    message_content: draft.message_content
  };

  navigateTo('scheduleMessage');
}

function renderScheduling() {
  const content = document.getElementById('content');
  const messages = AppState.scheduledMessages || [];
  const subscribedChats = AppState.subscribedChats || [];

  // Load drafts once per render so UI is always accurate
  loadMessageDrafts();
  const drafts = AppState.messageDrafts || [];

  const activeTab = AppState.schedulingActiveTab || 'queue';

  content.innerHTML = `
    <div class="animate-slide-up">
      <div class="grid grid-cols-3 gap-6">

        <!-- LEFT: Quick Schedule -->
        <div class="card" style="grid-column: span 1;">
          <div class="flex items-center gap-3 mb-6">
            <div class="stat-icon teal" style="width: 40px; height: 40px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold">Quick Schedule</h3>
              <p class="text-xs text-muted">Send a new message</p>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div class="form-group">
              <label class="form-label">Recipient</label>
              <select id="quick-recipient">
                <option value="">Select a chat.</option>
                ${(subscribedChats || []).map(chat =>
                  `<option value="${chat.user_id}" data-chat-id="${chat.chat_id}" data-platform="${chat.platform || 'whatsapp'}">
                    ${chat.name || chat.id}
                  </option>`
                ).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Message</label>
              <textarea id="quick-message" rows="4" placeholder="Type your message."></textarea>
              <div class="flex justify-between mt-2">
                <span class="text-xs text-muted">Tip: save drafts for recurring messages</span>
                <button class="btn btn-ghost btn-sm" onclick="saveQuickDraft()" title="Save to Recurring Message Drafts">
                  Save Draft
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Schedule For</label>
              <input type="datetime-local" id="quick-datetime">
            </div>

            <button class="btn btn-primary w-full" onclick="quickScheduleMessage()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Schedule Message
            </button>

            <div class="divider"></div>

            <button class="btn btn-secondary w-full" onclick="navigateTo('scheduleMessage')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Open Full Editor
            </button>
          </div>
        </div>

        <!-- RIGHT: Tabs (Queue / Drafts) -->
        <div class="card" style="grid-column: span 2;">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h3 class="font-semibold">Messages</h3>
              <p class="text-sm text-muted">${messages.length} message${messages.length !== 1 ? 's' : ''} scheduled</p>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="AzureVMAPI.refreshSubscribedChats()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Refresh
            </button>
          </div>

          <!-- Top tab bar -->
          <div class="flex gap-2 mb-6">
            <button
              class="btn ${activeTab === 'queue' ? 'btn-primary' : 'btn-secondary'} btn-sm"
              onclick="setSchedulingTab('queue')"
            >
              Message Queue
            </button>

            <button
              class="btn ${activeTab === 'drafts' ? 'btn-primary' : 'btn-secondary'} btn-sm"
              onclick="setSchedulingTab('drafts')"
            >
              Recurring Message Drafts
            </button>
          </div>

          ${activeTab === 'drafts' ? `
            ${drafts.length === 0 ? `
              <div class="empty-state" style="padding: 48px 24px;">
                <div class="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <h3>No drafts yet</h3>
                <p>Write something in Quick Schedule and click <b>Save Draft</b>.</p>
              </div>
            ` : `
              <div class="flex flex-col">
                ${drafts.map((d, index) => {
                  const recipientName = getRecipientNameByUserId(d.target_user_id);
                  return `
                    <div class="message-item" style="animation: slideUp 0.3s ease ${index * 0.05}s both;">
                      <div class="message-status pending"></div>
                      <div class="message-content">
                        <div class="flex justify-between items-start mb-1">
                          <span class="message-recipient">${recipientName}</span>
                          <span class="badge badge-info">draft</span>
                        </div>
                        <p class="message-preview">${(d.message_content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                        <span class="text-xs text-muted mt-2">${formatDateTime(d.created_at)}</span>
                      </div>
                      <div class="flex gap-2">
                        <button class="btn btn-ghost btn-sm" onclick="openDraft('${d.id}')">
                          Open
                        </button>
                        <button class="btn-icon" onclick="deleteDraft('${d.id}')" title="Delete" style="color: var(--error);">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          ` : `
            ${messages.length === 0 ? `
              <div class="empty-state" style="padding: 48px 24px;">
                <div class="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <h3>No messages scheduled</h3>
                <p>Use the quick schedule form or open the full editor.</p>
              </div>
            ` : `
              <div class="flex flex-col">
                ${messages.map((msg, index) => {
                  const recipientName = msg.target_user_id
                    ? getRecipientName(msg.target_user_id)
                    : (msg.recipient || 'Unknown');

                  return `
                    <div class="message-item" style="animation: slideUp 0.3s ease ${index * 0.05}s both;">
                      <div class="message-status ${msg.status === 'sent' ? 'sent' : 'pending'}"></div>
                      <div class="message-content">
                        <div class="flex justify-between items-start mb-1">
                          <span class="message-recipient">${recipientName}</span>
                          <span class="badge ${msg.status === 'sent' ? 'badge-success' : 'badge-warning'}">${msg.status || 'Pending'}</span>
                        </div>
                        <p class="message-preview">${msg.message_content || ''}</p>
                        <span class="text-xs text-muted mt-2">${formatDateTime(msg.scheduled_time)}</span>
                      </div>
                      <div class="flex gap-2">
                        <button class="btn-icon" onclick="deleteMessage('${msg.id}')" title="Delete" style="color: var(--error);">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          `}
        </div>
      </div>

      <!-- Existing subscribed chats panel (kept as-is) -->
      <div class="card mt-6">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="font-semibold">Subscribed Chats</h3>
            <p class="text-sm text-muted">${subscribedChats.length} active chat${subscribedChats.length !== 1 ? 's' : ''}</p>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="AzureVMAPI.refreshSubscribedChats()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>

        ${subscribedChats.length === 0 ? `
          <div class="text-center py-8 text-muted"><p>No subscribed chats found.</p></div>
        ` : `
          <div class="grid grid-cols-3 gap-4">
            ${subscribedChats.map((chat, index) => `
              <div class="connection-card" style="animation: slideUp 0.3s ease ${index * 0.05}s both;">
                <div class="connection-icon whatsapp">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                </div>
                <div class="connection-info">
                  <div class="connection-name">${chat.name || chat.id}</div>
                  <div class="connection-status">${chat.type || 'Group'} • ${chat.platform || 'WhatsApp'}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;

  const datetimeInput = document.getElementById('quick-datetime');
  if (datetimeInput) {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    datetimeInput.value = now.toISOString().slice(0, 16);
  }
}

async function quickScheduleMessage() {
  const recipient = document.getElementById('quick-recipient').value;
  const message = document.getElementById('quick-message').value;
  const datetime = document.getElementById('quick-datetime').value;

  if (!recipient) { showNotification('Please select a recipient', 'warning'); return; }
  if (!message.trim()) { showNotification('Please enter a message', 'warning'); return; }
  if (!datetime) { showNotification('Please select a date and time', 'warning'); return; }

  try {
    showNotification('Scheduling message.', 'info');

    console.log('🔍 Quick Schedule - Selected recipient (user_id):', recipient);

    // Find the chat by user_id for display purposes
    const selectedChat = AppState.subscribedChats.find(c => c.user_id === recipient);
    console.log('✅ Found chat for user_id:', selectedChat);

    const scheduledTimestamp = new Date(datetime).toISOString();

    console.log('📤 Sending to Azure VM with target_user_id:', recipient);
    const serverResponse = await AzureVMAPI.scheduleMessage(recipient, message, scheduledTimestamp, []);

    // Use the server-assigned ID if available
    const serverId = serverResponse?.id || generateId();

    AppState.scheduledMessages.push({
      id: serverId,
      server_id: serverId,
      recipient: selectedChat?.name || recipient,
      message_content: message,
      scheduled_time: scheduledTimestamp,
      status: 'pending',
      target_user_id: recipient
    });

    showNotification('Message scheduled successfully!', 'success');

    document.getElementById('quick-recipient').value = '';
    document.getElementById('quick-message').value = '';

    renderScheduling();
  } catch (error) {
    console.error('Error scheduling message:', error);
    showNotification('Failed to schedule message: ' + error.message, 'error');
  }
}

async function deleteMessage(messageId) {
  const index = AppState.scheduledMessages.findIndex(m => m.id === messageId);
  if (index > -1) {
    const message = AppState.scheduledMessages[index];
    // Use server_id if available, otherwise use the message id
    const serverMessageId = message.server_id || message.id;

    try {
      await AzureVMAPI.deleteMessage(serverMessageId);
      AppState.scheduledMessages.splice(index, 1);
      showNotification('Message deleted', 'success');
      renderScheduling();
    } catch (error) {
      console.error('Error deleting message:', error);
      if (error.message && (error.message.includes('404') || error.message.includes('not found'))) {
        AppState.scheduledMessages.splice(index, 1);
        showNotification('Message removed (was already processed on server)', 'info');
        renderScheduling();
      } else {
        showNotification('Failed to delete message: ' + error.message, 'error');
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.renderScheduling = renderScheduling;
  window.quickScheduleMessage = quickScheduleMessage;
  window.deleteMessage = deleteMessage;

  // drafts
  window.saveQuickDraft = saveQuickDraft;
  window.deleteDraft = deleteDraft;
  window.openDraft = openDraft;
  window.setSchedulingTab = setSchedulingTab;
}
