// ============================================
// AZURE VM API - Chat Subscriptions + Messaging
// ============================================

const AzureVMAPI = {
  _pollingInterval: null,

  _baseUrl() {
    if (!AppState.azureVmUrl) return '';
    return String(AppState.azureVmUrl).replace(/\/$/, '');
  },

  async fetchSubscribedChats() {
    if (!AppState.azureVmUrl) {
      throw new Error('Azure VM URL not configured. Please set it in Settings.');
    }

    AppState.loadingSubscribedChats = true;

    try {
      const base = this._baseUrl();

      const response = await fetch(`${base}/subscribed-users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch subscribed chats: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data);

      // Handle array response
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

      const formattedChats = rawChats.map(chat => ({
        id: chat.chat_id || chat.id,
        name: chat.chat_name || chat.name || chat.chat_id || 'Unknown Chat',
        platform: chat.platform || 'whatsapp',
        type: chat.type || 'group',
        user_id: chat.user_id,
        from_sender: chat.from_sender || chat.user_id,
        created_at: chat.created_at
      }));

      console.log('Formatted chats:', formattedChats);
      AppState.subscribedChats = formattedChats;

      if (AppState.lastSync) {
        AppState.lastSync.subscribedChats = new Date().toISOString();
      }

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

    if (!AppState.userId) {
      throw new Error('User not authenticated. Please sign in.');
    }

    console.log('=== PREPARING TO SEND TO AZURE VM ===');

    let targetUserIdStr = '';
    if (Array.isArray(targetUserId)) {
      targetUserIdStr = targetUserId.join(',');
    } else if (typeof targetUserId === 'string') {
      targetUserIdStr = targetUserId;
    } else if (targetUserId != null) {
      targetUserIdStr = String(targetUserId);
    }

    let scheduledTsStr = '';
    if (scheduledTimestamp instanceof Date) {
      scheduledTsStr = scheduledTimestamp.toISOString();
    } else if (typeof scheduledTimestamp === 'string') {
      scheduledTsStr = scheduledTimestamp;
    } else if (scheduledTimestamp != null) {
      scheduledTsStr = String(scheduledTimestamp);
    }

    console.log('User UUID:', AppState.userId);
    console.log('Username:', AppState.username);
    console.log('Target user(s):', targetUserIdStr);
    console.log('Scheduled timestamp:', scheduledTsStr);
    console.log('Files received in scheduleMessage:', files ? files.length || 0 : 0);

    const formData = new FormData();
    formData.append('target_user_id', targetUserIdStr);
    formData.append('message', message);
    formData.append('scheduled_timestamp', scheduledTsStr);
    formData.append('from_sender', AppState.userId);
    formData.append('username', AppState.username || '');

    if (files && files.length > 0) {
      console.log('Adding files to FormData:');
      Array.from(files).forEach((file, index) => {
        try {
          console.log(`  [${index}] ${file.name} - ${file.size} bytes - ${file.type}`);
        } catch (e) {
          console.log(`  [${index}] file added (no metadata available)`);
        }
        formData.append('files', file);
      });
    } else {
      console.log('No files to add to FormData');
    }

    const endpoint = `${this._baseUrl()}/schedule-message`;

    console.log('Sending POST to:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
      } catch (e) {
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch (e2) {}
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('=== MESSAGE SCHEDULED SUCCESSFULLY ===');
    console.log('Response from server:', result);
    return result;
  },

  async subscribeUser(chatId, chatName) {
    if (!AppState.azureVmUrl) {
      throw new Error('Azure VM URL not configured. Please set it in Settings.');
    }

    const endpoint = `${this._baseUrl()}/subscribe-user`;
    try {
      const body = {
        chat_id: chatId,
        chat_name: chatName,
        from_sender: AppState.userId
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const data = await res.json();
          msg = data.detail || data.error || data.message || msg;
        } catch (e) {
          try { const text = await res.text(); if (text) msg = text; } catch (_) {}
        }
        throw new Error(msg);
      }

      const data = await res.json();
      console.log('Subscribed user response:', data);
      return data;
    } catch (err) {
      console.error('subscribeUser error:', err);
      throw err;
    }
  },

  async getPendingMessages() {
    if (!AppState.azureVmUrl) {
      throw new Error('Azure VM URL not configured. Please set it in Settings.');
    }

    if (!AppState.userId) {
      throw new Error('User not authenticated. Please sign in.');
    }

    const endpoint = `${this._baseUrl()}/pending-messages?from_sender=${encodeURIComponent(AppState.userId)}`;

    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const data = await res.json();
          msg = data.detail || data.error || data.message || msg;
        } catch (e) {
          try { const text = await res.text(); if (text) msg = text; } catch (_) {}
        }
        throw new Error(msg);
      }

      const data = await res.json();
      console.log('Pending messages for user:', AppState.userId, data);
      return data;
    } catch (err) {
      console.error('getPendingMessages error:', err);
      throw err;
    }
  },

  async syncMessagesFromServer() {
    try {
      if (!AppState.userId) {
        console.log('⚠️ No user ID - skipping message sync');
        return;
      }

      const serverMessages = await this.getPendingMessages();

      if (!Array.isArray(serverMessages)) {
        console.warn('Server returned non-array for pending messages:', serverMessages);
        return;
      }

      console.log(`📊 Fetched ${serverMessages.length} message(s) from server for user ${AppState.userId}`);

      let updatedCount = 0;
      let addedCount = 0;

      AppState.scheduledMessages = AppState.scheduledMessages || [];

      serverMessages.forEach(serverMsg => {
        const localMsg = AppState.scheduledMessages.find(m => m.id === serverMsg.id);

        if (localMsg) {
          if (!localMsg.from_sender || localMsg.from_sender === AppState.userId) {
            if (localMsg.status !== 'sent' && serverMsg.is_sent === true) {
              console.log(`✓ Message ${serverMsg.id} marked as SENT on server`);
              localMsg.status = 'sent';
              localMsg.sent_at = serverMsg.sent_at || new Date().toISOString();
              updatedCount++;
            } else if (serverMsg.is_sent === false && localMsg.status !== 'pending') {
              localMsg.status = 'pending';
              updatedCount++;
            }
          }
        } else {
          console.log(`➕ Adding new message from server: ${serverMsg.id}`);
          AppState.scheduledMessages.push({
            id: serverMsg.id,
            recipient: Array.isArray(serverMsg.target_user_id)
              ? serverMsg.target_user_id.join(', ')
              : serverMsg.target_user_id,
            message_content: serverMsg.message,
            content: serverMsg.message,
            scheduled_time: serverMsg.scheduled_timestamp,
            scheduled_timestamp: serverMsg.scheduled_timestamp,
            target_user_id: serverMsg.target_user_id,
            status: serverMsg.is_sent ? 'sent' : 'pending',
            created_at: serverMsg.created_at || new Date().toISOString(),
            sent_at: serverMsg.sent_at,
            from_sender: AppState.userId,
            file_paths: serverMsg.file_paths || [],
            platform: 'whatsapp'
          });
          addedCount++;
        }
      });

      if (updatedCount > 0 || addedCount > 0) {
        console.log(`✓ Sync complete: ${updatedCount} updated, ${addedCount} added`);

        if (AppState.currentView === 'scheduling' && typeof renderScheduling === 'function') {
          renderScheduling();
        }

        if (typeof showNotification === 'function') {
          const totalChanges = updatedCount + addedCount;
          showNotification(`${totalChanges} message(s) synced from server`, 'success');
        }
      } else {
        console.log('No messages updated from server sync');
      }

      return serverMessages;
    } catch (error) {
      console.error('Error syncing messages from server:', error);
    }
  },

  startMessagePolling(intervalMs = 30000) {
    this.stopMessagePolling();

    console.log(`🔄 Starting message polling (every ${intervalMs / 1000}s)`);

    this.syncMessagesFromServer();

    this._pollingInterval = setInterval(() => {
      if (AppState.azureVmUrl) {
        this.syncMessagesFromServer();
      }
    }, intervalMs);
  },

  stopMessagePolling() {
    console.log('⏹️ Stopping message polling');
    clearInterval(this._pollingInterval);
    this._pollingInterval = null;
  }
};

// Expose AzureVMAPI to global scope
if (typeof window !== 'undefined') {
  window.AzureVMAPI = AzureVMAPI;
}
