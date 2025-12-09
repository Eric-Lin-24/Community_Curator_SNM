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
      const response = await fetch(`${AppState.azureVmUrl}/subscribed_users`, {
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

      // Handle array response directly (your API returns array)
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

    console.log('=== PREPARING TO SEND TO AZURE VM ===');
    console.log('Files received in scheduleMessage:', files.length);

    // Prepare form data
    const formData = new FormData();
    formData.append('target_user_id', targetUserId.toString());
    formData.append('message', message);
    formData.append('scheduled_timestamp', scheduledTimestamp); // ISO 8601 format

    // Add files if any
    if (files && files.length > 0) {
      console.log('Adding files to FormData:');
      Array.from(files).forEach((file, index) => {
        console.log(`  [${index}] ${file.name} - ${file.size} bytes - ${file.type}`);
        formData.append('files', file);
      });
    } else {
      console.log('No files to add to FormData');
    }

    console.log('Sending POST to:', `${AppState.azureVmUrl}/schedule_message`);
    console.log('Payload summary:', {
      target_user_id: targetUserId,
      message: message,
      scheduled_timestamp: scheduledTimestamp,
      files_count: files.length
    });

    // Send POST request
    const response = await fetch(`${AppState.azureVmUrl}/schedule_message`, {
      method: 'POST',
      body: formData
      // Don't set Content-Type - browser handles it for FormData
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
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
    console.log(`Message scheduled with ${files.length} file(s) uploaded`);
    if (files.length > 0) {
      console.log('Files uploaded to server:');
      files.forEach((file, index) => {
        console.log(`  [${index + 1}] ${file.name} - ${file.size} bytes`);
      });
    }
    return result;
  }
};
