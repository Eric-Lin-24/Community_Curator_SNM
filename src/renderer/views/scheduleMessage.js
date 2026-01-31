// ============================================
// SCHEDULE MESSAGE PAGE
// Full message composer with file attachments
// ============================================

// Store selected local files (cloud files are in AppState.selectedCloudFilesForScheduler)
let selectedLocalFiles = [];

// --------------------------------------------
// Helpers: safe escaping for inline onclick
// --------------------------------------------
function _escAttr(str = '') {
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Download file from OneDrive (MAIN PROCESS via IPC)
 * This avoids CSP issues because Graph /content redirects to SharePoint.
 * @param {string} fileId - OneDrive file ID
 * @param {string} fileName - File name
 * @returns {Promise<File>} - Downloaded file as File object
 */
async function downloadFileFromOneDrive(fileId, fileName) {
  try {
    console.log('=== ONEDRIVE DOWNLOAD START (IPC) ===');
    console.log('File ID:', fileId);
    console.log('File Name:', fileName);

    if (!AppState.isAuthenticated) {
      throw new Error('Not authenticated with Microsoft. Please sign in.');
    }

    if (!window?.electronAPI?.downloadOneDriveFile) {
      throw new Error('downloadOneDriveFile IPC is not available. Add it to preload + main process.');
    }

    // Main process should use the stored token; no renderer fetch.
    const result = await window.electronAPI.downloadOneDriveFile(fileId, fileName);

    if (!result || !result.buffer) {
      throw new Error('OneDrive download returned no data buffer.');
    }

    const uint8Array = new Uint8Array(result.buffer);
    const blob = new Blob([uint8Array], { type: result.mimeType || 'application/octet-stream' });
    const file = new File([blob], result.fileName || fileName, { type: result.mimeType || 'application/octet-stream' });

    console.log('=== ONEDRIVE DOWNLOAD COMPLETE ===');
    console.log('✓ File object created:', file.name, file.size, 'bytes', file.type);

    return file;
  } catch (error) {
    console.error('=== ONEDRIVE DOWNLOAD FAILED ===');
    console.error('✗ Error:', error.message);
    throw new Error(`Failed to download "${fileName}" from OneDrive: ${error.message}`);
  }
}

async function downloadFileFromGoogleDriveFixed(fileId, fileName, mimeType) {
  console.log('=== GOOGLE DRIVE DOWNLOAD START ===');
  console.log('File ID:', fileId);
  console.log('File Name:', fileName);
  console.log('MIME Type:', mimeType);

  if (typeof window?.electronAPI?.downloadGoogleDriveFile !== 'function') {
    throw new Error('downloadGoogleDriveFile IPC is not available in this build.');
  }

  const result = await window.electronAPI.downloadGoogleDriveFile(fileId, fileName, mimeType);

  if (!result || !result.buffer) {
    throw new Error('Google Drive download returned no file buffer.');
  }

  const uint8Array = new Uint8Array(result.buffer);
  const blob = new Blob([uint8Array], { type: result.mimeType || mimeType || 'application/octet-stream' });
  const file = new File([blob], result.fileName || fileName || `gdrive_${fileId}`, {
    type: result.mimeType || mimeType || 'application/octet-stream'
  });

  console.log('✓ Google Drive File object created:', file.name, file.size, file.type);
  console.log('=== GOOGLE DRIVE DOWNLOAD COMPLETE ===');
  return file;
}

function renderScheduleMessagePage() {
  const content = document.getElementById('content');
  const subscribedChats = AppState.subscribedChats || [];
  selectedLocalFiles = [];

  content.innerHTML = `
    <div class="animate-slide-up">
      <!-- Back Button -->
      <button class="btn btn-ghost mb-6" onclick="navigateTo('scheduling')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Back to Messages
      </button>

      <div class="grid grid-cols-3 gap-6">
        <!-- Main Form -->
        <div class="card" style="grid-column: span 2;">
          <h3 class="text-lg font-semibold mb-6">Compose Message</h3>

          <div class="flex flex-col gap-6">
            <!-- Recipient Selection -->
            <div class="form-group">
              <label class="form-label">Recipient</label>
              <select id="message-recipient" class="form-input">
                <option value="">Select a chat or group...</option>
                ${subscribedChats.map(chat => {
                  const chatId = chat.id || chat.chat_id;
                  const chatName = chat.name || chat.chat_name || chatId;
                  return `<option value="${chatId}" data-user-id="${chat.user_id || ''}">${chatName} (${chat.type || chat.platform || 'Group'})</option>`;
                }).join('')}
              </select>
              ${subscribedChats.length === 0 ? `
                <p class="text-xs text-muted mt-2">
                  No subscribed chats found.
                  <button class="text-accent" style="background: none; border: none; cursor: pointer; text-decoration: underline;" onclick="AzureVMAPI.refreshSubscribedChats()">Refresh chats</button>
                </p>
              ` : ''}
            </div>

            <!-- Message Content -->
            <div class="form-group">
              <label class="form-label">Message</label>
              <textarea
                id="message-content"
                class="form-input"
                rows="8"
                placeholder="Type your message here..."
                style="resize: vertical; min-height: 150px;"
                oninput="updateCharCount()"
              ></textarea>
              <div class="flex justify-between mt-2">
                <span class="text-xs text-muted">Supports basic text formatting</span>
                <span class="text-xs text-muted"><span id="char-count">0</span> characters</span>
              </div>
            </div>

            <!-- File Attachments -->
            <div class="form-group">
              <label class="form-label">Attachments</label>

              <!-- Two attachment options side by side -->
              <div class="grid grid-cols-2 gap-4 mb-4">
                <!-- Local file upload -->
                <div
                  id="file-drop-zone"
                  class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-primary"
                  style="border-color: var(--border-default); background: var(--bg-tertiary);"
                  onclick="document.getElementById('file-input').click()"
                >
                  <input type="file" id="file-input" multiple style="display: none;" onchange="handleLocalFileSelect(event)">
                  <div style="width: 48px; height: 48px; margin: 0 auto 12px; border-radius: 12px; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-muted);">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p class="text-sm font-medium" style="color: var(--text-primary);">Local Files</p>
                  <p class="text-xs text-muted mt-1">Drop or click to browse</p>
                </div>

                <!-- Cloud storage button -->
                <div
                  class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-primary"
                  style="border-color: var(--border-default); background: var(--bg-tertiary);"
                  onclick="goToDocumentsForSelection()"
                >
                  <div style="width: 48px; height: 48px; margin: 0 auto 12px; border-radius: 12px; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-muted);">
                      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                    </svg>
                  </div>
                  <p class="text-sm font-medium" style="color: var(--text-primary);">Cloud Storage</p>
                  <p class="text-xs text-muted mt-1">Select from Documents</p>
                </div>
              </div>

              <!-- Selected Files List -->
              <div id="file-list" class="flex flex-col gap-2"></div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="flex flex-col gap-6">
          <!-- Schedule Options -->
          <div class="card">
            <h4 class="font-semibold mb-4">Schedule</h4>

            <div class="form-group mb-4">
              <label class="form-label">Date & Time</label>
              <input type="datetime-local" id="message-datetime" class="form-input">
            </div>

            <div class="flex flex-col gap-2 mb-4">
              <button class="btn btn-ghost btn-sm justify-start" onclick="setQuickSchedule('now')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                Send Immediately
              </button>
              <button class="btn btn-ghost btn-sm justify-start" onclick="setQuickSchedule('1h')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                In 1 Hour
              </button>
              <button class="btn btn-ghost btn-sm justify-start" onclick="setQuickSchedule('tomorrow')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Tomorrow 9 AM
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="card">
            <h4 class="font-semibold mb-4">Actions</h4>
            <div class="flex flex-col gap-3">
              <button class="btn btn-primary w-full" onclick="submitScheduledMessage()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Schedule Message
              </button>
              <button class="btn btn-secondary w-full" onclick="saveDraft()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save Draft
              </button>
              <button class="btn btn-ghost w-full" onclick="clearForm()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Clear Form
              </button>
            </div>
          </div>

          <!-- Tips -->
          <div class="card" style="background: var(--accent-primary-soft); border-color: var(--border-accent);">
            <h4 class="font-semibold mb-2" style="color: var(--accent-primary);">Tips</h4>
            <ul class="text-sm text-muted" style="list-style: disc; padding-left: 20px;">
              <li class="mb-1">Schedule messages during active hours for better engagement</li>
              <li class="mb-1">Keep messages concise and clear</li>
              <li>Attach relevant documents to provide context</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

  // Set default datetime to now + 1 hour
  const datetimeInput = document.getElementById('message-datetime');
  if (datetimeInput) {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    datetimeInput.value = now.toISOString().slice(0, 16);
  }
  // ✅ If calendar set a prefill datetime, use it once
  if (AppState.composePrefillDateTimeLocal) {
    const datetimeInput = document.getElementById('message-datetime');
    if (datetimeInput) {
      datetimeInput.value = AppState.composePrefillDateTimeLocal;
    }
    AppState.composePrefillDateTimeLocal = null; // one-time use
  }

  // Setup drag and drop
  setupDragAndDrop();

  // Render any previously selected files (e.g., when returning from documents selection)
  renderFileList();
  // ==========================================================
  // ✅ APPLY PREFILL FROM DRAFTS (recipient + message)
  // AppState.scheduleMessagePrefill = { target_user_id, message_content }
  // ==========================================================
  try {
    const prefill = AppState.scheduleMessagePrefill;
    if (prefill && (prefill.target_user_id || prefill.message_content)) {
      const recipientSelect = document.getElementById('message-recipient');
      const messageBox = document.getElementById('message-content');

      // Recipient: match by option dataset userId
      if (recipientSelect && prefill.target_user_id) {
        const options = Array.from(recipientSelect.options || []);
        const match = options.find(opt => String(opt.dataset.userId || '') === String(prefill.target_user_id));
        if (match) recipientSelect.value = match.value;
      }

      // Message text
      if (messageBox && typeof prefill.message_content === 'string') {
        messageBox.value = prefill.message_content;
      }

      updateCharCount();

      // Clear so it doesn't keep reapplying
      AppState.scheduleMessagePrefill = null;
    }
  } catch (e) {
    console.warn('Draft prefill failed:', e);
  }
}

// Character counter
function updateCharCount() {
  const textarea = document.getElementById('message-content');
  const counter = document.getElementById('char-count');
  if (textarea && counter) {
    counter.textContent = textarea.value.length;
  }
}

// Local file handling
function handleLocalFileSelect(event) {
  const files = event.target.files;
  if (files) {
    Array.from(files).forEach(file => {
      if (!selectedLocalFiles.find(f => f.name === file.name && f.size === file.size)) {
        selectedLocalFiles.push(file);
      }
    });
    renderFileList();
  }
}

function removeLocalFile(index) {
  selectedLocalFiles.splice(index, 1);
  renderFileList();
}

// Navigate to documents page for cloud file selection
function goToDocumentsForSelection() {
  // Enable file selection mode
  AppState.fileSelectionMode = true;
  AppState.fileSelectionStartedFromDocuments = false; // Coming from scheduler
  // Navigate to documents
  navigateTo('documents');
}

// Remove a cloud file from selection
function removeCloudFileFromScheduler(fileId) {
  AppState.selectedCloudFilesForScheduler = (AppState.selectedCloudFilesForScheduler || []).filter(f => f.id !== fileId);
  renderFileList();
}

// Render combined file list (local + cloud from AppState)
function renderFileList() {
  const fileList = document.getElementById('file-list');
  if (!fileList) return;

  const cloudFiles = AppState.selectedCloudFilesForScheduler || [];
  const allFiles = [];

  // Add local files
  selectedLocalFiles.forEach((file, index) => {
    allFiles.push({ type: 'local', index, name: file.name, size: file.size, source: 'Local', sourceRaw: 'local' });
  });

  // Add cloud files from AppState
  cloudFiles.forEach((file) => {
    const isOneDrive = file.source === 'onedrive';
    allFiles.push({
      type: 'cloud',
      id: file.id,
      name: file.name || file.title,
      size: file.size,
      source: isOneDrive ? 'OneDrive' : 'Google Drive',
      sourceRaw: file.source,
      mimeType: file.mimeType
    });
  });

  if (allFiles.length === 0) {
    fileList.innerHTML = '';
    return;
  }

  fileList.innerHTML = allFiles.map(file => {
    const isOneDrive = file.sourceRaw === 'onedrive';
    const isGoogleDrive = file.sourceRaw === 'googledrive';
    const sourceColor = isOneDrive ? '#0078d4' : (isGoogleDrive ? '#4285f4' : 'var(--text-muted)');

    return `
    <div class="flex items-center gap-3 p-3 rounded-xl" style="background: var(--bg-secondary); border: 1px solid var(--border-subtle);">
      <!-- Icon -->
      <div style="width: 40px; height: 40px; border-radius: 10px; background: ${file.type === 'cloud' ? (isOneDrive ? 'rgba(0,120,212,0.1)' : 'rgba(66,133,244,0.1)') : 'var(--bg-tertiary)'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${file.type === 'cloud' ? sourceColor : 'var(--text-muted)'}" stroke-width="2">
          ${file.type === 'cloud'
            ? '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>'
            : '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'
          }
        </svg>
      </div>

      <!-- File info -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium truncate">${file.name}</p>
        <div class="flex items-center gap-2 mt-0.5">
          ${file.type === 'cloud' ? `<span style="width: 6px; height: 6px; border-radius: 50%; background: ${sourceColor};"></span>` : ''}
          <span class="text-xs" style="color: ${file.type === 'cloud' ? sourceColor : 'var(--text-muted)'};">${file.source}</span>
          ${file.size ? `<span class="text-xs text-muted">•</span><span class="text-xs text-muted">${formatFileSize(file.size)}</span>` : ''}
        </div>
      </div>

      <!-- Remove button -->
      <button class="btn-icon" onclick="${file.type === 'local' ? `removeLocalFile(${file.index})` : `removeCloudFileFromScheduler('${file.id}')`}" style="width: 32px; height: 32px; border-radius: 8px; background: var(--bg-tertiary); color: var(--text-muted);" onmouseover="this.style.color='var(--error)'" onmouseout="this.style.color='var(--text-muted)'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `}).join('');
}

// Drag and drop
function setupDragAndDrop() {
  const dropZone = document.getElementById('file-drop-zone');
  if (!dropZone) return;

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false);
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.style.borderColor = 'var(--accent-primary)';
      dropZone.style.background = 'var(--accent-primary-soft)';
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.style.borderColor = 'var(--border-default)';
      dropZone.style.background = 'var(--bg-tertiary)';
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (!selectedLocalFiles.find(f => f.name === file.name && f.size === file.size)) {
          selectedLocalFiles.push(file);
        }
      });
      renderFileList();
    }
  });
}

// Quick schedule
function setQuickSchedule(option) {
  const datetimeInput = document.getElementById('message-datetime');
  if (!datetimeInput) return;

  const now = new Date();
  switch (option) {
    case 'now': now.setMinutes(now.getMinutes() + 1); break;
    case '1h': now.setHours(now.getHours() + 1); break;
    case 'tomorrow': now.setDate(now.getDate() + 1); now.setHours(9, 0, 0, 0); break;
  }
  datetimeInput.value = now.toISOString().slice(0, 16);
  showNotification('Schedule time updated', 'info');
}

// Submit message
async function submitScheduledMessage() {
  const recipientSelect = document.getElementById('message-recipient');
  const recipientValue = recipientSelect ? recipientSelect.value : '';
  const content = document.getElementById('message-content')?.value || '';
  const datetime = document.getElementById('message-datetime')?.value || '';

  const normalizeSource = (src) => String(src || '').trim().toLowerCase();

  if (!recipientValue) { showNotification('Please select a recipient', 'warning'); return; }
  if (!content.trim()) { showNotification('Please enter a message', 'warning'); return; }
  if (!datetime) { showNotification('Please select a schedule time', 'warning'); return; }

  const selectedChat = (AppState.subscribedChats || []).find(c => c.id === recipientValue || c.chat_id === recipientValue);
  if (!selectedChat) { showNotification('Selected chat not found. Please refresh.', 'error'); return; }

  const targetUserId = selectedChat.user_id;
  if (!targetUserId) { showNotification('Could not determine target user ID.', 'error'); return; }

  try {
    showNotification('Preparing message...', 'info');

    const cloudFilesToSend = AppState.selectedCloudFilesForScheduler || [];

    console.log('=== FILE PREP (SCHEDULE PAGE) ===');
    console.log('Local files:', selectedLocalFiles.length, selectedLocalFiles.map(f => f.name));
    console.log('Cloud selections:', cloudFilesToSend.length, cloudFilesToSend);

    const downloadedCloudFiles = [];
    if (cloudFilesToSend.length > 0) {
      showNotification(`Downloading ${cloudFilesToSend.length} cloud file(s)...`, 'info');
      for (const cloudFile of cloudFilesToSend) {
        const source = normalizeSource(cloudFile.source);

        console.log('--- Cloud file ---');
        console.log('name:', cloudFile.name);
        console.log('id:', cloudFile.id);
        console.log('source(raw):', cloudFile.source);
        console.log('source(norm):', source);

        try {
          let downloadedFile = null;

          if (source === 'onedrive') {
            downloadedFile = await downloadFileFromOneDrive(cloudFile.id, cloudFile.name);
          } else if (source === 'googledrive') {
            downloadedFile = await downloadFileFromGoogleDriveFixed(
              cloudFile.id,
              cloudFile.name,
              cloudFile.mimeType || ''
            );
          } else {
            throw new Error(`Unknown cloud source: "${cloudFile.source}"`);
          }

          if (downloadedFile) {
            downloadedCloudFiles.push(downloadedFile);
            console.log('✓ Downloaded:', downloadedFile.name, downloadedFile.size, downloadedFile.type);
          } else {
            console.warn('✗ Download returned null/undefined for:', cloudFile.name);
          }
        } catch (error) {
          console.error(`Failed to download ${cloudFile.name}:`, error);
          showNotification(`Failed to download ${cloudFile.name}`, 'error');
        }
      }
    }

    const allFiles = [...selectedLocalFiles, ...downloadedCloudFiles];

    console.log('=== FINAL FILES TO SEND ===');
    console.log('Downloaded cloud files:', downloadedCloudFiles.length, downloadedCloudFiles.map(f => f.name));
    console.log('Total files:', allFiles.length, allFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));

    showNotification('Scheduling message...', 'info');

    const scheduledTimestamp = new Date(datetime).toISOString();
    await AzureVMAPI.scheduleMessage(targetUserId, content, scheduledTimestamp, allFiles);

    const chatName = selectedChat.name || selectedChat.chat_name || selectedChat.id;
    AppState.scheduledMessages = AppState.scheduledMessages || [];
    AppState.scheduledMessages.push({
      id: generateId(),
      recipient: chatName,
      message_content: content,
      scheduled_time: scheduledTimestamp,
      target_user_id: targetUserId,
      status: 'pending',
      files: allFiles.map(f => ({ name: f.name, size: f.size }))
    });

    const fileCountMsg = allFiles.length > 0 ? ` with ${allFiles.length} file(s)` : '';
    showNotification(`Message scheduled successfully${fileCountMsg}!`, 'success');
    navigateTo('scheduling');
  } catch (error) {
    console.error('Error scheduling message:', error);
    showNotification('Failed to schedule message: ' + error.message, 'error');
  }
}

// ✅ Draft saving for "Recurring Message Drafts"
function _draftStorageKey() {
  return AppState.userId ? `message_drafts_${AppState.userId}` : 'message_drafts_guest';
}

function _loadDrafts() {
  try {
    const raw = localStorage.getItem(_draftStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function _saveDrafts(drafts) {
  try {
    localStorage.setItem(_draftStorageKey(), JSON.stringify(drafts || []));
  } catch (e) {
    console.warn('Failed to save drafts:', e);
  }
}

function saveDraft() {
  const recipientSelect = document.getElementById('message-recipient');
  const recipientValue = recipientSelect ? recipientSelect.value : '';
  const message = document.getElementById('message-content')?.value || '';

  if (!recipientValue) { showNotification('Please select a recipient', 'warning'); return; }
  if (!message.trim()) { showNotification('Please enter a message to save', 'warning'); return; }

  const selectedChat = (AppState.subscribedChats || []).find(c => c.id === recipientValue || c.chat_id === recipientValue);
  const targetUserId = selectedChat?.user_id;

  if (!targetUserId) {
    showNotification('Could not determine target user for this recipient', 'error');
    return;
  }

  const drafts = _loadDrafts();
  drafts.unshift({
    id: generateId(),
    target_user_id: targetUserId,
    message_content: message,
    created_at: new Date().toISOString()
  });
  _saveDrafts(drafts);

  showNotification('Draft saved', 'success');
}

function clearForm() {
  const recipientSelect = document.getElementById('message-recipient');
  const contentTextarea = document.getElementById('message-content');
  if (recipientSelect) recipientSelect.value = '';
  if (contentTextarea) contentTextarea.value = '';
  selectedLocalFiles = [];
  AppState.selectedCloudFilesForScheduler = [];
  renderFileList();
  updateCharCount();
  showNotification('Form cleared', 'info');
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.renderScheduleMessagePage = renderScheduleMessagePage;
  window.updateCharCount = updateCharCount;
  window.handleLocalFileSelect = handleLocalFileSelect;
  window.removeLocalFile = removeLocalFile;
  window.goToDocumentsForSelection = goToDocumentsForSelection;
  window.removeCloudFileFromScheduler = removeCloudFileFromScheduler;
  window.renderFileList = renderFileList;
  window.setQuickSchedule = setQuickSchedule;
  window.submitScheduledMessage = submitScheduledMessage;
  window.saveDraft = saveDraft;
  window.clearForm = clearForm;
}
