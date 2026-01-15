// ============================================
// SCHEDULING VIEW
// ============================================

function renderScheduling() {
  const content = document.getElementById('content');
  const messages = AppState.scheduledMessages || [];
  const subscribedChats = AppState.subscribedChats || [];

  content.innerHTML = `
    <div class="animate-slide-up">
      <div class="grid grid-cols-3 gap-6">
        
        <div class="card" style="grid-column: span 1;">
          <div class="flex items-center gap-3 mb-6">
            <div class="stat-icon teal" style="width: 40px; height: 40px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
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
                <option value="">Select a chat...</option>
                ${subscribedChats.map(chat => `<option value="${chat.user_id}" data-chat-id="${chat.chat_id}" data-platform="${chat.platform || 'whatsapp'}">${chat.name || chat.id}</option>`).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Message</label>
              <textarea id="quick-message" rows="4" placeholder="Type your message..."></textarea>
            </div>
            
            <div class="form-group">
              <label class="form-label">Schedule For</label>
              <input type="datetime-local" id="quick-datetime">
            </div>
            
            <button class="btn btn-primary w-full" onclick="quickScheduleMessage()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Schedule Message
            </button>
            
            <div class="divider"></div>
            
            <button class="btn btn-secondary w-full" onclick="navigateTo('scheduleMessage')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Open Full Editor
            </button>
          </div>
        </div>

        <div class="card" style="grid-column: span 2;">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h3 class="font-semibold">Message Queue</h3>
              <p class="text-sm text-muted">${messages.length} message${messages.length !== 1 ? 's' : ''} scheduled</p>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="AzureVMAPI.refreshSubscribedChats()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              Refresh
            </button>
          </div>

          ${messages.length === 0 ? `
            <div class="empty-state" style="padding: 48px 24px;">
              <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
              <h3>No messages scheduled</h3>
              <p>Use the quick schedule form or open the full editor.</p>
            </div>
          ` : `
            <div class="flex flex-col">
              ${messages.map((msg, index) => {
                // Get human-readable recipient name from target_user_id
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              `;}).join('')}
            </div>
          `}
        </div>
      </div>

      <div class="card mt-6">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="font-semibold">Subscribed Chats</h3>
            <p class="text-sm text-muted">${subscribedChats.length} active chat${subscribedChats.length !== 1 ? 's' : ''}</p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="AzureVMAPI.refreshSubscribedChats()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Refresh
          </button>
        </div>
        
        ${subscribedChats.length === 0 ? `
          <div class="text-center py-8 text-muted"><p>No subscribed chats found.</p></div>
        ` : `
          <div class="grid grid-cols-3 gap-4">
            ${subscribedChats.map((chat, index) => `
              <div class="connection-card" style="animation: slideUp 0.3s ease ${index * 0.05}s both;">
                <div class="connection-icon whatsapp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div>
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
    showNotification('Scheduling message...', 'info');

    console.log('🔍 Quick Schedule - Selected recipient (user_id):', recipient);

    // Find the chat by user_id for display purposes
    const selectedChat = AppState.subscribedChats.find(c => c.user_id === recipient);
    console.log('✅ Found chat for user_id:', selectedChat);

    const scheduledTimestamp = new Date(datetime).toISOString();

    console.log('📤 Sending to Azure VM with target_user_id:', recipient);
    await AzureVMAPI.scheduleMessage(recipient, message, scheduledTimestamp, []);

    AppState.scheduledMessages.push({
      id: generateId(),
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

function deleteMessage(messageId) {
  const index = AppState.scheduledMessages.findIndex(m => m.id === messageId);
  if (index > -1) {
    AppState.scheduledMessages.splice(index, 1);
    showNotification('Message deleted', 'success');
    renderScheduling();
  }
}

if (typeof window !== 'undefined') {
  window.renderScheduling = renderScheduling;
  window.quickScheduleMessage = quickScheduleMessage;
  window.deleteMessage = deleteMessage;
}