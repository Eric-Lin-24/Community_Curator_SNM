// ============================================
// AZURE VM API - Chat Subscriptions
// ============================================
// This module provides Azure VM API integration for WhatsApp chat subscriptions and message scheduling.
// It requires AppState and utility functions (showNotification, renderScheduling) to be defined globally.

const AzureVMAPI = {
  async fetchSubscribedChats() {
    if (!AppState.azureVmUrl) {
      throw new Error('Azure VM URL not configured. Please set it in Settings.');
    }

    AppState.loadingSubscribedChats = true;

    try {
      const response = await fetch(`${AppState.azureVmUrl}/subscribed-users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Add timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch subscribed chats: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data); // Debug log

      // Handle array response (your API returns array)
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
      const formattedChats = rawChats.map(chat => ({
        id: chat.chat_id || chat.id,           // Use chat_id as the primary ID
        name: chat.chat_name || chat.name || chat.chat_id || 'Unknown Chat',  // Use chat_name
        platform: chat.platform || 'whatsapp',  // Default to whatsapp if not specified
        type: chat.type || 'group',             // Default to group if not specified
        user_id: chat.user_id,                  // Keep user_id for reference
        from_sender: chat.from_sender || chat.user_id, // Track who subscribed to this chat
        created_at: chat.created_at             // Keep created_at for reference
      }));

      console.log('Formatted chats:', formattedChats); // Debug log
      AppState.subscribedChats = formattedChats;
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

      // If we're on the scheduling page, re-render to show updated list
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

    // Normalize targetUserId: accept string, array, or single value
    let targetUserIdStr = '';
    if (Array.isArray(targetUserId)) {
      targetUserIdStr = targetUserId.join(',');
    } else if (typeof targetUserId === 'string') {
      targetUserIdStr = targetUserId;
    } else if (targetUserId != null) {
      // e.g. number or other primitive
      targetUserIdStr = String(targetUserId);
    }

    // Normalize scheduledTimestamp: accept Date object or ISO string
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

    // Prepare form data
    const formData = new FormData();
    formData.append('target_user_id', targetUserIdStr);
    formData.append('message', message);
    formData.append('scheduled_timestamp', scheduledTsStr); // ISO 8601 format expected by FastAPI
    formData.append('from_sender', AppState.userId); // Add from_sender field with sender's UUID
    formData.append('username', AppState.username); // Add username for reference

    // Add files if any
    if (files && files.length > 0) {
      console.log('Adding files to FormData:');
      Array.from(files).forEach((file, index) => {
        try {
          console.log(`  [${index}] ${file.name} - ${file.size} bytes - ${file.type}`);
        } catch (e) {
          // some environments (non-browser) may not have file metadata
          console.log(`  [${index}] file added (no metadata available)`);
        }
        // Append using the same field name 'files' to match FastAPI's List[UploadFile]
        formData.append('files', file);
      });
    } else {
      console.log('No files to add to FormData');
    }

    // Use the FastAPI route: /schedule-message
    const endpoint = `${AppState.azureVmUrl.replace(/\/$/, '')}/schedule-message`;

    console.log('Sending POST to:', endpoint);
    console.log('Payload summary:', {
      user_id: AppState.userId,
      target_user_id: targetUserIdStr,
      message: message,
      scheduled_timestamp: scheduledTsStr,
      files_count: files ? files.length || 0 : 0
    });

    // Send POST request
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
      // Don't set Content-Type - browser handles it for FormData
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, try text
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch (e2) {
          // Keep default error message
        }
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('=== MESSAGE SCHEDULED SUCCESSFULLY ===');
    console.log('Response from server:', result);
    console.log('✓ Message linked to user:', AppState.userProfile?.email);
    const uploadedCount = files ? files.length || 0 : 0;
    console.log(`Message scheduled with ${uploadedCount} file(s) uploaded`);
    if (uploadedCount > 0) {
      console.log('Files uploaded to server:');
      Array.from(files).forEach((file, index) => {
        try {
          console.log(`  [${index + 1}] ${file.name} - ${file.size} bytes`);
        } catch (e) {
          console.log(`  [${index + 1}] file uploaded (no metadata)`);
        }
      });
    }
    return result;
  },

  async subscribeUser(chatId, chatName) {
    if (!AppState.azureVmUrl) {
      throw new Error('Azure VM URL not configured. Please set it in Settings.');
    }

    const endpoint = `${AppState.azureVmUrl.replace(/\/$/, '')}/subscribe-user`;
    try {
      const body = {
        chat_id: chatId,
        chat_name: chatName,
        from_sender: AppState.userId // Add from_sender to track who subscribed to this chat
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

    // Add from_sender as query parameter to filter messages by current user
    const endpoint = `${AppState.azureVmUrl.replace(/\/$/, '')}/pending-messages?from_sender=${AppState.userId}`;
    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
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

  /**
   * Sync pending messages from server and update local state
   * Updates status for messages that have been sent
   * Adds new messages from server (already filtered by from_sender)
   */
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

      // Process server messages
      serverMessages.forEach(serverMsg => {
        const localMsg = AppState.scheduledMessages.find(m => m.id === serverMsg.id);

        if (localMsg) {
          // Update existing message
          if (!localMsg.from_sender || localMsg.from_sender === AppState.userId) {
            // Check if status changed from pending to sent
            if (localMsg.status !== 'sent' && serverMsg.is_sent === true) {
              console.log(`✓ Message ${serverMsg.id} marked as SENT on server`);
              localMsg.status = 'sent';
              localMsg.sent_at = serverMsg.sent_at || new Date().toISOString();
              updatedCount++;
            } else if (serverMsg.is_sent === false && localMsg.status !== 'pending') {
              // Update back to pending if server says not sent
              localMsg.status = 'pending';
              updatedCount++;
            }
          }
        } else {
          // Add new message from server (already filtered by from_sender on backend)
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
            from_sender: AppState.userId, // Mark as belonging to current user
            file_paths: serverMsg.file_paths || [],
            platform: 'whatsapp' // default
          });
          addedCount++;
        }
      });

      if (updatedCount > 0 || addedCount > 0) {
        console.log(`✓ Sync complete: ${updatedCount} updated, ${addedCount} added`);

        // Re-render scheduling view if we're on that page
        if (AppState.currentView === 'scheduling' && typeof renderScheduling === 'function') {
          renderScheduling();
        }

        // Show notification for updates
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
      // Don't throw - we don't want polling to break the app
    }
  },

  /**
   * Start polling for message updates
   * @param {number} intervalMs - Polling interval in milliseconds (default: 30 seconds)
   */
  startMessagePolling(intervalMs = 30000) {
    // Clear any existing polling
    this.stopMessagePolling();

    console.log(`🔄 Starting message polling (every ${intervalMs / 1000}s)`);

    // Do initial sync
    this.syncMessagesFromServer();

    // Start interval
    this._pollingInterval = setInterval(() => {
      if (AppState.azureVmUrl) {
        this.syncMessagesFromServer();
      }
    }, intervalMs);
  },

  /**
   * Stop polling for message updates
   */
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
