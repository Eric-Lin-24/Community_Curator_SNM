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

      // Map your schema (user_id, chat_id, chat_name, created_at) to internal format
      const formattedChats = rawChats.map(chat => {
        console.log('Raw chat from server:', chat); // Debug: see what backend actually returns
        return {
          id: chat.chat_id || chat.id,           // Use chat_id for display/selection
          chat_id: chat.chat_id,                 // Keep original chat_id
          name: chat.chat_name || chat.name || chat.chat_id || 'Unknown Chat',  // Use chat_name
          platform: chat.platform || 'whatsapp',  // Default to whatsapp if not specified
          type: chat.type || 'group',             // Default to group if not specified
          user_id: chat.user_id,                  // user_id for targeting messages - THIS IS THE IMPORTANT ONE
          from_sender: chat.from_sender || chat.user_id, // Track who subscribed to this chat
          created_at: chat.created_at             // Keep created_at for reference
        };
      });

      console.log('Formatted chats with user_id:', formattedChats); // Debug: verify user_id is present
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

  async deleteMessage(messageId) {
    if (!AppState.azureVmUrl) {
      throw new Error('Azure VM URL not configured. Please set it in Settings.');
    }

    if (!AppState.userId) {
      throw new Error('User not authenticated. Please sign in.');
    }

    if (!messageId) {
      throw new Error('messageId is required to delete a scheduled message');
    }

    const base = this._baseUrl();
    const deleteUrl = `${base}/delete-message?message_id=${encodeURIComponent(messageId)}`;

    try {
      let res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });

      // If server explicitly rejects DELETE (405), attempt POST fallback using form data
      if (res.status === 405) {
        console.warn('DELETE not allowed on server; attempting POST fallback');
        const formData = new FormData();
        formData.append('message_id', messageId);
        res = await fetch(`${base}/delete-message`, { method: 'POST', body: formData });
      }

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
      console.log('deleteMessage response:', data);
      return data === true || data === 'true' || (data && data.deleted === true);
    } catch (err) {
      console.error('deleteMessage error:', err);
      throw err;
    }
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

      // Create a map of server message IDs for quick lookup
      const serverMessageIds = new Set(serverMessages.map(m => m.id));

      AppState.scheduledMessages = AppState.scheduledMessages || [];

      // First, remove local messages that no longer exist on the server (were deleted)
      // and update messages that have been sent
      const messagesToRemove = [];
      AppState.scheduledMessages.forEach((localMsg, index) => {
        // Find matching server message by ID or by server_id
        const serverMsg = serverMessages.find(s => s.id === localMsg.id || s.id === localMsg.server_id);

        if (serverMsg) {
          // Update status if message was sent
          if (serverMsg.is_sent === true && localMsg.status !== 'sent') {
            console.log(`✓ Message ${serverMsg.id} marked as SENT`);
            localMsg.status = 'sent';
            localMsg.sent_at = serverMsg.sent_at || new Date().toISOString();
          }
          // Make sure the server ID is stored
          if (!localMsg.server_id && serverMsg.id) {
            localMsg.server_id = serverMsg.id;
          }
          // Update the main id to match server id for consistency
          if (localMsg.id !== serverMsg.id) {
            localMsg.id = serverMsg.id;
          }
        } else if (localMsg.server_id && !serverMessageIds.has(localMsg.server_id)) {
          // Message was deleted from server
          console.log(`🗑️ Message ${localMsg.id} no longer on server, removing locally`);
          messagesToRemove.push(index);
        }
      });

      // Remove messages that were deleted on the server (in reverse order to preserve indices)
      messagesToRemove.reverse().forEach(index => {
        AppState.scheduledMessages.splice(index, 1);
      });

      // Add new messages from server that we don't have locally
      let addedCount = 0;
      serverMessages.forEach(serverMsg => {
        const existsLocally = AppState.scheduledMessages.some(
          m => m.id === serverMsg.id || m.server_id === serverMsg.id
        );

        if (!existsLocally) {
          console.log(`➕ Adding new message from server: ${serverMsg.id}`);

          // Look up human-readable name from subscribed chats using target_user_id
          let displayName = null;
          const targetId = Array.isArray(serverMsg.target_user_id)
            ? serverMsg.target_user_id[0]
            : serverMsg.target_user_id;

          if (targetId && AppState.subscribedChats) {
            const matchingChat = AppState.subscribedChats.find(chat => chat.user_id === targetId);
            if (matchingChat) {
              displayName = matchingChat.name || matchingChat.chat_name;
              console.log(`✅ Found name for user_id ${targetId}: "${displayName}"`);
            } else {
              console.log(`⚠️ No subscribed chat found for user_id: ${targetId}`);
            }
          }

          AppState.scheduledMessages.push({
            id: serverMsg.id,
            server_id: serverMsg.id,
            recipient: displayName || (Array.isArray(serverMsg.target_user_id)
              ? serverMsg.target_user_id.join(', ')
              : serverMsg.target_user_id),
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

      const totalChanges = messagesToRemove.length + addedCount;
      if (totalChanges > 0) {
        console.log(`✓ Sync complete: ${messagesToRemove.length} removed, ${addedCount} added`);

        if (AppState.currentView === 'scheduling' && typeof renderScheduling === 'function') {
          renderScheduling();
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
