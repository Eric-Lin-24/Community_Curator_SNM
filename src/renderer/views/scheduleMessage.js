// ============================================
// SCHEDULE MESSAGE VIEW (Dedicated Page)
// ============================================

/**
 * Render the dedicated schedule message page
 * Provides an expanded, spacious interface for scheduling messages
 */
function renderScheduleMessagePage() {
  const content = document.getElementById('content');

  // Generate options for subscribed chats
  const subscribedChatsOptions = AppState.subscribedChats.map((chat, index) => {
    const chatId = chat.id || chat.chat_id || `chat_${index}`;
    const chatName = chat.name || chat.chat_name || chatId;
    const platform = chat.platform || 'whatsapp';

    return `<option value="${chatId}" data-platform="${platform}">${chatName} (${platform})</option>`;
  }).join('');

  content.innerHTML = `
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <button
          onclick="navigateTo('scheduling')"
          class="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          title="Back to Scheduling"
        >
          <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Schedule New Message</h2>
          <p class="text-gray-600 mt-1">Create and schedule a message to your community</p>
        </div>
      </div>

      <!-- Main Form -->
      <form onsubmit="scheduleMessageFromPage(event)" class="space-y-6">
        <!-- Platform & Recipient Section -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 class="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            Recipient & Platform
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Platform Selection -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">Messaging Platform</label>
              <select
                id="msg-platform-page"
                required
                onchange="toggleRecipientInputPage()"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="whatsapp" selected>WhatsApp</option>
                <option value="sms">SMS</option>
                <option value="telegram">Telegram</option>
                <option value="email">Email</option>
              </select>
            </div>

            <!-- Subscribed Chats -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <label class="block text-sm font-semibold text-gray-700">Subscribed Chats</label>
                <button
                  type="button"
                  onclick="refreshSubscribedChatsInPage()"
                  class="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                  title="Refresh subscribed chats"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
              ${AppState.subscribedChats.length > 0 ? `
                <select
                  id="msg-subscribed-chat-page"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  onchange="onSubscribedChatSelectPage()"
                >
                  <option value="">-- Select from subscribed chats --</option>
                  ${subscribedChatsOptions}
                </select>
              ` : `
                <div class="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ${AppState.azureVmUrl ? 'No subscribed chats found. Click refresh to load.' : 'Configure Azure VM URL in Settings to load subscribed chats.'}
                </div>
              `}
            </div>
          </div>

          <!-- Recipient Input -->
          <div class="mt-6">
            <label class="block text-sm font-semibold text-gray-700 mb-3">Recipient</label>
            <input
              type="text"
              id="msg-recipient-page"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="Enter recipient name or number"
            />
            <p class="text-xs text-gray-500 mt-2">Or select from subscribed chats above</p>
          </div>
        </div>

        <!-- Message Content Section -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 class="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Message Content
          </h3>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-3">Your Message</label>
            <textarea
              id="msg-content-page"
              rows="8"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none"
              placeholder="Type your message here..."
            ></textarea>
            <div class="flex items-center justify-between mt-2">
              <p class="text-xs text-gray-500">Write a clear and concise message</p>
              <p id="char-count-page" class="text-xs text-gray-500">0 characters</p>
            </div>
          </div>
        </div>

        <!-- Attachments Section -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 class="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Attachments (Optional)
          </h3>

          <!-- File source tabs -->
          <div class="flex gap-3 mb-6">
            <button
              type="button"
              onclick="switchFileSourcePage('local')"
              id="tab-local-page"
              class="flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all bg-blue-600 text-white shadow-sm"
            >
              <div class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Local Files
              </div>
            </button>
            <button
              type="button"
              onclick="switchFileSourcePage('cloud')"
              id="tab-cloud-page"
              class="flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <div class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Cloud Storage
              </div>
            </button>
          </div>

          <!-- Local file upload -->
          <div id="local-file-section-page" class="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
            <input
              type="file"
              id="msg-attachments-page"
              multiple
              class="hidden"
              onchange="handleFileSelectPage(event)"
            />
            <label for="msg-attachments-page" class="cursor-pointer block">
              <div class="flex flex-col items-center justify-center">
                <div class="p-4 bg-blue-100 rounded-full mb-4">
                  <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p class="text-base font-semibold text-gray-700 mb-2">Click to upload from computer</p>
                <p class="text-sm text-gray-500">PDF, DOC, Images (Max 10MB each)</p>
              </div>
            </label>
          </div>

          <!-- Cloud storage file picker -->
          <div id="cloud-file-section-page" class="hidden border border-gray-300 rounded-xl p-6 max-h-96 overflow-y-auto">
            <div class="flex items-center justify-between mb-4">
              <p class="text-sm font-semibold text-gray-700">Select from Cloud Storage</p>
              <button
                type="button"
                onclick="refreshCloudFilesForPickerPage()"
                class="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
            <div id="cloud-file-list-picker-page" class="space-y-2">
              <p class="text-sm text-gray-500 text-center py-8">Loading files...</p>
            </div>
          </div>

          <!-- Selected files display -->
          <div id="file-list-page" class="mt-6 space-y-3"></div>
        </div>

        <!-- Schedule Time Section -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 class="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule Date & Time
          </h3>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-3">When should this message be sent?</label>
            <input
              type="datetime-local"
              id="msg-schedule-page"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
            <p class="text-xs text-gray-500 mt-2">Select the date and time for message delivery</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onclick="navigateTo('scheduling')"
            class="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all text-base font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-base font-semibold flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Schedule Message
          </button>
        </div>
      </form>
    </div>
  `;

  // Add character counter - use setTimeout to ensure DOM is ready
  setTimeout(() => {
    const contentTextarea = document.getElementById('msg-content-page');
    const charCount = document.getElementById('char-count-page');
    if (contentTextarea && charCount) {
      contentTextarea.addEventListener('input', () => {
        charCount.textContent = `${contentTextarea.value.length} characters`;
      });

      // Ensure textarea is focusable and clickable
      contentTextarea.style.pointerEvents = 'auto';
      contentTextarea.style.zIndex = '1';
    }
  }, 0);
}

// Store for cloud files selected for attachment
let selectedCloudFilesPage = [];

/**
 * Handle selection of a subscribed chat from dropdown
 */
function onSubscribedChatSelectPage() {
  const select = document.getElementById('msg-subscribed-chat-page');
  const recipientInput = document.getElementById('msg-recipient-page');
  const platformSelect = document.getElementById('msg-platform-page');

  if (select && recipientInput && select.value) {
    const selectedOption = select.options[select.selectedIndex];
    const chatId = select.value;
    const platform = selectedOption.getAttribute('data-platform') || 'whatsapp';

    const chat = AppState.subscribedChats.find(c => c.id === chatId);
    if (chat) {
      recipientInput.value = chat.name || chat.id;
      const platformLower = platform.toLowerCase();
      if (['whatsapp', 'sms', 'telegram', 'email'].includes(platformLower)) {
        platformSelect.value = platformLower;
      }
    }
  }
}

/**
 * Refresh subscribed chats in the page
 */
async function refreshSubscribedChatsInPage() {
  try {
    showNotification('Refreshing subscribed chats...', 'info');
    await AzureVMAPI.fetchSubscribedChats();
    showNotification(`Loaded ${AppState.subscribedChats.length} subscribed chat(s)`, 'success');
    renderScheduleMessagePage();
  } catch (error) {
    showNotification('Failed to refresh: ' + error.message, 'error');
  }
}

/**
 * Toggle recipient input visibility
 */
function toggleRecipientInputPage() {
  // Placeholder for platform-specific logic
}

/**
 * Handle file selection from local file input
 */
function handleFileSelectPage(event) {
  const files = event.target.files;
  updateFileListDisplay();
}

/**
 * Switch between local and cloud file sources
 */
function switchFileSourcePage(source) {
  const localSection = document.getElementById('local-file-section-page');
  const cloudSection = document.getElementById('cloud-file-section-page');
  const tabLocal = document.getElementById('tab-local-page');
  const tabCloud = document.getElementById('tab-cloud-page');

  if (source === 'local') {
    localSection.classList.remove('hidden');
    cloudSection.classList.add('hidden');
    tabLocal.className = 'flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all bg-blue-600 text-white shadow-sm';
    tabCloud.className = 'flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all bg-gray-100 text-gray-700 hover:bg-gray-200';
  } else {
    localSection.classList.add('hidden');
    cloudSection.classList.remove('hidden');
    tabLocal.className = 'flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all bg-gray-100 text-gray-700 hover:bg-gray-200';
    tabCloud.className = 'flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all bg-blue-600 text-white shadow-sm';
    loadCloudFilesForPickerPage();
  }
}

/**
 * Load cloud files into the picker
 */
async function loadCloudFilesForPickerPage() {
  const cloudFileList = document.getElementById('cloud-file-list-picker-page');
  if (!cloudFileList) return;

  cloudFileList.innerHTML = '<p class="text-sm text-gray-500 text-center py-8">Loading files...</p>';

  try {
    let files = [];
    if (AppState.activeDocumentSource === 'googledrive' && AppState.googleDriveConnected) {
      files = await GoogleDriveAPI.getGoogleDriveFiles();
    } else if (AppState.isAuthenticated) {
      files = await MicrosoftGraphAPI.getOneDriveFiles();
    }

    if (files.length === 0) {
      cloudFileList.innerHTML = '<p class="text-sm text-gray-500 text-center py-8">No files found. Please connect to OneDrive or Google Drive.</p>';
      return;
    }

    cloudFileList.innerHTML = files.map(file => `
      <div class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-200 cursor-pointer transition-colors" onclick="toggleCloudFileSelectionPage('${file.id}', '${file.title.replace(/'/g, "\\'")}', '${file.source}')">
        <input type="checkbox" id="cloud-file-page-${file.id}" class="w-4 h-4 text-blue-600" onclick="event.stopPropagation(); toggleCloudFileSelectionPage('${file.id}', '${file.title.replace(/'/g, "\\'")}', '${file.source}')">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-700 truncate">${file.title}</p>
          <p class="text-xs text-gray-500">${file.source === 'onedrive' ? 'OneDrive' : 'Google Drive'} • ${formatFileSize(file.size || 0)}</p>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading cloud files:', error);
    cloudFileList.innerHTML = '<p class="text-sm text-red-500 text-center py-8">Failed to load files. Please try again.</p>';
  }
}

/**
 * Toggle cloud file selection
 */
function toggleCloudFileSelectionPage(fileId, fileName, source) {
  const checkbox = document.getElementById(`cloud-file-page-${fileId}`);
  if (!checkbox) return;

  checkbox.checked = !checkbox.checked;

  if (checkbox.checked) {
    selectedCloudFilesPage.push({ id: fileId, name: fileName, source: source });
  } else {
    selectedCloudFilesPage = selectedCloudFilesPage.filter(f => f.id !== fileId);
  }

  updateFileListDisplay();
}

/**
 * Refresh cloud files in picker
 */
async function refreshCloudFilesForPickerPage() {
  await loadCloudFilesForPickerPage();
  showNotification('Cloud files refreshed', 'success');
}

/**
 * Update the display of selected files
 */
function updateFileListDisplay() {
  const fileList = document.getElementById('file-list-page');
  if (!fileList) return;

  const fileInput = document.getElementById('msg-attachments-page');
  const localFiles = fileInput ? Array.from(fileInput.files) : [];

  fileList.innerHTML = '';

  // Show cloud files
  selectedCloudFilesPage.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg';
    fileItem.innerHTML = `
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div class="p-2 bg-blue-100 rounded-lg flex-shrink-0">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-700 truncate">${file.name}</p>
          <p class="text-xs text-blue-600 mt-0.5">☁️ From ${file.source === 'onedrive' ? 'OneDrive' : 'Google Drive'}</p>
        </div>
      </div>
      <button
        type="button"
        onclick="removeCloudFilePage(${index})"
        class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2 flex-shrink-0"
        title="Remove file"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    `;
    fileList.appendChild(fileItem);
  });

  // Show local files
  localFiles.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow';
    fileItem.innerHTML = `
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div class="p-2 bg-gray-100 rounded-lg flex-shrink-0">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-700 truncate">${file.name}</p>
          <p class="text-xs text-gray-500 mt-0.5">📁 Local • ${(file.size / 1024).toFixed(1)} KB</p>
        </div>
      </div>
      <button
        type="button"
        onclick="removeFilePage(${index})"
        class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2 flex-shrink-0"
        title="Remove file"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    `;
    fileList.appendChild(fileItem);
  });
}

/**
 * Remove file from local file selection
 */
function removeFilePage(index) {
  const fileInput = document.getElementById('msg-attachments-page');
  if (!fileInput) return;

  const dt = new DataTransfer();
  const files = fileInput.files;

  for (let i = 0; i < files.length; i++) {
    if (i !== index) {
      dt.items.add(files[i]);
    }
  }

  fileInput.files = dt.files;
  updateFileListDisplay();
}

/**
 * Remove cloud file from selection
 */
function removeCloudFilePage(index) {
  const file = selectedCloudFilesPage[index];
  selectedCloudFilesPage.splice(index, 1);

  const checkbox = document.getElementById(`cloud-file-page-${file.id}`);
  if (checkbox) checkbox.checked = false;

  updateFileListDisplay();
}

/**
 * Schedule a message from the dedicated page
 */
async function scheduleMessageFromPage(event) {
  event.preventDefault();

  if (!AppState.azureVmUrl) {
    showNotification('Please configure Azure VM URL in Settings first', 'error');
    return;
  }

  const platform = document.getElementById('msg-platform-page').value;
  const recipient = document.getElementById('msg-recipient-page').value;
  const content = document.getElementById('msg-content-page').value;
  const scheduledTime = document.getElementById('msg-schedule-page').value;
  const fileInput = document.getElementById('msg-attachments-page');
  const selectedChatSelect = document.getElementById('msg-subscribed-chat-page');

  if (!content || !scheduledTime) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }

  // Get the target_user_id from selected chat
  let targetUserId = null;
  if (selectedChatSelect && selectedChatSelect.value) {
    const selectedChat = AppState.subscribedChats.find(c => c.id === selectedChatSelect.value);
    if (selectedChat && selectedChat.user_id) {
      targetUserId = selectedChat.user_id;
    }
  }

  if (!targetUserId && recipient) {
    const chatByName = AppState.subscribedChats.find(c =>
      c.name === recipient || c.id === recipient || c.chat_id === recipient
    );
    if (chatByName && chatByName.user_id) {
      targetUserId = chatByName.user_id;
    }
  }

  if (!targetUserId) {
    showNotification('Could not determine target user. Please select a chat from the dropdown.', 'error');
    return;
  }

  const scheduledTimestamp = new Date(scheduledTime).toISOString();
  const localFiles = fileInput && fileInput.files.length > 0 ? Array.from(fileInput.files) : [];

  showNotification('Preparing files and scheduling message...', 'info');

  try {
    const downloadedCloudFiles = [];

    if (selectedCloudFilesPage.length > 0) {
      showNotification(`Downloading ${selectedCloudFilesPage.length} file(s) from cloud storage...`, 'info');

      for (const cloudFile of selectedCloudFilesPage) {
        try {
          let downloadedFile;

          if (cloudFile.source === 'onedrive') {
            // OneDrive download only needs fileId and fileName (already in cloudFile)
            downloadedFile = await downloadFileFromOneDrive(cloudFile.id, cloudFile.name);
          } else if (cloudFile.source === 'googledrive') {
            // Google Drive needs mimeType from full file metadata
            const fullFile = AppState.documents.find(d => d.id === cloudFile.id);
            if (!fullFile) {
              throw new Error(`File metadata not found for: ${cloudFile.name}`);
            }
            downloadedFile = await downloadFileFromGoogleDrive(cloudFile.id, cloudFile.name, fullFile.mimeType);
          } else {
            throw new Error(`Unknown file source: ${cloudFile.source}`);
          }

          downloadedCloudFiles.push(downloadedFile);
        } catch (error) {
          console.error(`Failed to download ${cloudFile.name}:`, error);
          showNotification(`Failed to download ${cloudFile.name}: ${error.message}`, 'error');
        }
      }

      if (downloadedCloudFiles.length > 0) {
        showNotification(`Downloaded ${downloadedCloudFiles.length} file(s) successfully`, 'success');
      }
    }

    const allFiles = [...localFiles, ...downloadedCloudFiles];

    showNotification('Scheduling message...', 'info');

    const result = await AzureVMAPI.scheduleMessage(targetUserId, content, scheduledTimestamp, allFiles);

    const newMessage = {
      id: result.id || result.message_id || generateId(),
      platform: platform,
      recipient: recipient,
      content: content,
      message_content: content,
      scheduled_time: scheduledTime,
      scheduled_timestamp: scheduledTimestamp,
      target_user_id: targetUserId,
      status: result.status || 'pending',
      created_at: new Date().toISOString(),
      from_sender: AppState.userId, // Track which user created this message
      server_response: result
    };

    AppState.scheduledMessages.push(newMessage);
    selectedCloudFilesPage = [];

    navigateTo('scheduling');

    const fileCountMsg = allFiles.length > 0 ? ` with ${allFiles.length} file(s)` : '';
    showNotification(
      `✓ Message scheduled successfully${fileCountMsg}! Will be sent ${formatDateTime(scheduledTime)}`,
      'success'
    );
  } catch (error) {
    console.error('Error scheduling message:', error);
    showNotification('Failed to schedule message: ' + error.message, 'error');
  }
}

// Export functions to global scope
if (typeof window !== 'undefined') {
  window.renderScheduleMessagePage = renderScheduleMessagePage;
  window.onSubscribedChatSelectPage = onSubscribedChatSelectPage;
  window.refreshSubscribedChatsInPage = refreshSubscribedChatsInPage;
  window.toggleRecipientInputPage = toggleRecipientInputPage;
  window.handleFileSelectPage = handleFileSelectPage;
  window.switchFileSourcePage = switchFileSourcePage;
  window.loadCloudFilesForPickerPage = loadCloudFilesForPickerPage;
  window.toggleCloudFileSelectionPage = toggleCloudFileSelectionPage;
  window.refreshCloudFilesForPickerPage = refreshCloudFilesForPickerPage;
  window.updateFileListDisplay = updateFileListDisplay;
  window.removeFilePage = removeFilePage;
  window.removeCloudFilePage = removeCloudFilePage;
  window.scheduleMessageFromPage = scheduleMessageFromPage;
}
