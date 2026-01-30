// ============================================
// SCHEDULE MESSAGE PAGE
// Full message composer with file attachments
// ============================================

// Store selected files (local + cloud)
let selectedLocalFiles = [];
let selectedCloudFilesPage = [];

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

// --------------------------------------------
// UI Render
// --------------------------------------------
function renderScheduleMessagePage() {
  const content = document.getElementById('content');
  const subscribedChats = AppState.subscribedChats || [];
  selectedLocalFiles = [];
  selectedCloudFilesPage = [];

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
                <option value="">Select a chat or group.</option>
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
                placeholder="Type your message here."
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

              <div id="file-drop-zone" class="rounded-xl p-4" style="border: 1px dashed var(--border-default); background: var(--bg-tertiary);">
                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3">
                    <div class="stat-icon teal" style="width: 40px; height: 40px;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-sm font-medium">Drag files here</p>
                      <p class="text-xs text-muted">or add from your computer / cloud</p>
                    </div>
                  </div>

                  <div class="flex gap-2">
                    <label class="btn btn-secondary btn-sm" style="cursor:pointer;">
                      Add local
                      <input type="file" multiple style="display:none;" onchange="handleLocalFileSelect(event)">
                    </label>

                    <button class="btn btn-secondary btn-sm" onclick="switchFileSourcePage('cloud')">
                      Add from cloud
                    </button>
                  </div>
                </div>

                <div id="cloud-file-section-page" class="hidden mt-4 rounded-xl p-3" style="border: 1px solid var(--border-subtle); background: var(--bg-secondary);">
                  <div class="flex items-center justify-between mb-3">
                    <p class="text-sm font-medium">Select from Cloud Storage</p>
                    <button class="btn btn-ghost btn-sm" onclick="refreshCloudFilesForPickerPage()">Refresh</button>
                  </div>
                  <div id="cloud-file-list-picker-page" class="space-y-2" style="max-height: 260px; overflow-y: auto;">
                    <p class="text-sm text-muted text-center py-4">Loading files.</p>
                  </div>
                </div>

                <div id="file-list" class="mt-4"></div>
              </div>
            </div>

            <!-- Schedule Time -->
            <div class="form-group">
              <label class="form-label">Schedule Time</label>
              <input id="message-datetime" type="datetime-local" class="form-input"/>
              <p class="text-xs text-muted mt-2">Times are interpreted in your local timezone.</p>
            </div>

            <div class="flex gap-3">
              <button class="btn btn-primary" onclick="submitScheduledMessage()">Schedule</button>
              <button class="btn btn-ghost" onclick="clearForm()">Clear</button>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="flex flex-col gap-6">
          <div class="card">
            <h4 class="font-semibold mb-4">Quick Schedule</h4>
            <div class="flex flex-col gap-2">
              <button class="btn btn-ghost btn-sm justify-start" onclick="setQuickSchedule('now')">Now (+1 min)</button>
              <button class="btn btn-ghost btn-sm justify-start" onclick="setQuickSchedule('1h')">In 1 hour</button>
              <button class="btn btn-ghost btn-sm justify-start" onclick="setQuickSchedule('tomorrow')">Tomorrow 9 AM</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  setupDragAndDrop();
  updateCharCount();
    // If Dashboard (or anywhere else) requested a prefilled schedule time, apply it once.
    // AppState.scheduleMessagePrefillISO should be an ISO string.
    try {
      const prefillISO = AppState && AppState.scheduleMessagePrefillISO;
      if (prefillISO) {
        const dt = document.getElementById('message-datetime');
        if (dt) dt.value = new Date(prefillISO).toISOString().slice(0, 16);
        AppState.scheduleMessagePrefillISO = null;
      }
    } catch (e) {
      // no-op: prefill is best-effort
    }

}

function updateCharCount() {
  const textarea = document.getElementById('message-content');
  const counter = document.getElementById('char-count');
  if (!textarea || !counter) return;
  counter.textContent = String((textarea.value || '').length);
}

function handleLocalFileSelect(event) {
  const files = event?.target?.files ? Array.from(event.target.files) : [];
  files.forEach(file => {
    if (!selectedLocalFiles.find(f => f.name === file.name && f.size === file.size)) {
      selectedLocalFiles.push(file);
    }
  });
  renderFileList();
}

function removeLocalFile(index) {
  selectedLocalFiles.splice(index, 1);
  renderFileList();
}

function switchFileSourcePage(source) {
  const cloud = document.getElementById('cloud-file-section-page');
  if (!cloud) return;
  if (source === 'cloud') {
    cloud.classList.remove('hidden');
    loadCloudFilesForPickerPage();
  } else {
    cloud.classList.add('hidden');
  }
}

async function loadCloudFilesForPickerPage() {
  const cloudFileList = document.getElementById('cloud-file-list-picker-page');
  if (!cloudFileList) return;

  cloudFileList.innerHTML = '<p class="text-sm text-muted text-center py-4">Loading files.</p>';

  try {
    let files = [];

    // Pull from both providers if connected
    if (AppState.googleDriveConnected) {
      const gdFiles = await GoogleDriveAPI.getGoogleDriveFiles();
      files = files.concat(gdFiles || []);
    }

    if (AppState.isAuthenticated) {
      const odFiles = await MicrosoftGraphAPI.getOneDriveFiles();
      files = files.concat(odFiles || []);
    }

    if (!files || files.length === 0) {
      cloudFileList.innerHTML = '<p class="text-sm text-muted text-center py-4">No files found. Connect to OneDrive or Google Drive.</p>';
      return;
    }

    cloudFileList.innerHTML = files.map(file => {
      const isSelected = selectedCloudFilesPage.find(f => f.id === file.id);
      const safeTitle = _escAttr(file.title || '');
      const safeSource = _escAttr(file.source || '');
      const safeMime = _escAttr(file.mimeType || '');

      return `
        <div class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'selected' : ''}"
             style="border: 1px solid var(--border-subtle); ${isSelected ? 'background: var(--accent-primary-soft);' : ''}"
             onclick="toggleCloudFileSelectionPage('${file.id}', '${safeTitle}', '${safeSource}', '${safeMime}')">
          <input type="checkbox" id="cloud-file-page-${file.id}" ${isSelected ? 'checked' : ''} class="w-4 h-4" onclick="event.stopPropagation();">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">${file.title || 'Untitled'}</p>
            <p class="text-xs text-muted">${file.source === 'onedrive' ? 'OneDrive' : 'Google Drive'} • ${formatFileSize(file.size || 0)}</p>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading cloud files:', error);
    cloudFileList.innerHTML = '<p class="text-sm text-center py-4" style="color: var(--error);">Failed to load files.</p>';
  }
}

// Toggle cloud file selection (store mimeType too)
function toggleCloudFileSelectionPage(fileId, fileName, source, mimeType = '') {
  const existingIndex = selectedCloudFilesPage.findIndex(f => f.id === fileId);

  if (existingIndex >= 0) {
    selectedCloudFilesPage.splice(existingIndex, 1);
  } else {
    selectedCloudFilesPage.push({
      id: fileId,
      name: fileName,
      source: source,
      mimeType: mimeType
    });
  }

  const checkbox = document.getElementById(`cloud-file-page-${fileId}`);
  if (checkbox) checkbox.checked = existingIndex < 0;

  renderFileList();
}

async function refreshCloudFilesForPickerPage() {
  await loadCloudFilesForPickerPage();
  showNotification('Cloud files refreshed', 'success');
}

// Render combined file list
function renderFileList() {
  const fileList = document.getElementById('file-list');
  if (!fileList) return;

  const allFiles = [];

  selectedLocalFiles.forEach((file, index) => {
    allFiles.push({ type: 'local', index, name: file.name, size: file.size, source: 'Local' });
  });

  selectedCloudFilesPage.forEach((file, index) => {
    allFiles.push({ type: 'cloud', index, id: file.id, name: file.name, source: file.source === 'onedrive' ? 'OneDrive' : 'Google Drive' });
  });

  if (allFiles.length === 0) {
    fileList.innerHTML = '';
    return;
  }

  fileList.innerHTML = allFiles.map(file => `
    <div class="flex items-center gap-3 p-3 rounded-lg" style="background: var(--bg-tertiary); border: 1px solid var(--border-subtle);">
      <div class="stat-icon ${file.type === 'cloud' ? 'blue' : 'teal'}" style="width: 36px; height: 36px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${file.type === 'cloud'
            ? '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>'
            : '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'
          }
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium truncate">${file.name}</p>
        <p class="text-xs text-muted">${file.source}${file.size ? ' • ' + formatFileSize(file.size) : ''}</p>
      </div>
      <button class="btn-icon" onclick="${file.type === 'local' ? `removeLocalFile(${file.index})` : `removeCloudFile('${file.id}')`}" style="width: 32px; height: 32px;">
        ✕
      </button>
    </div>
  `).join('');
}

function removeCloudFile(fileId) {
  selectedCloudFilesPage = selectedCloudFilesPage.filter(f => f.id !== fileId);
  const checkbox = document.getElementById(`cloud-file-page-${fileId}`);
  if (checkbox) checkbox.checked = false;
  renderFileList();
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

// Submit message (FIXED)
async function submitScheduledMessage() {
  const recipientSelect = document.getElementById('message-recipient');
  const recipientValue = recipientSelect ? recipientSelect.value : '';
  const content = document.getElementById('message-content')?.value || '';
  const datetime = document.getElementById('message-datetime')?.value || '';

  const normalizeSource = (src) => String(src || '').trim().toLowerCase();

  if (!recipientValue) { showNotification('Please select a recipient', 'warning'); return; }
  if (!content.trim()) { showNotification('Please enter a message', 'warning'); return; }
  if (!datetime) { showNotification('Please select a schedule time', 'warning'); return; }

  const selectedChat = (AppState.subscribedChats || []).find(
    c => c.id === recipientValue || c.chat_id === recipientValue
  );
  if (!selectedChat) { showNotification('Selected chat not found. Please refresh.', 'error'); return; }

  const targetUserId = selectedChat.user_id;
  if (!targetUserId) { showNotification('Could not determine target user ID.', 'error'); return; }

  try {
    showNotification('Preparing message...', 'info');

    console.log('=== FILE PREP (SCHEDULE PAGE) ===');
    console.log('Local files:', selectedLocalFiles.length, selectedLocalFiles.map(f => f.name));
    console.log('Cloud selections:', selectedCloudFilesPage.length, selectedCloudFilesPage);

    const downloadedCloudFiles = [];

    if (selectedCloudFilesPage.length > 0) {
      showNotification(`Downloading ${selectedCloudFilesPage.length} cloud file(s)...`, 'info');

      for (const cloudFile of selectedCloudFilesPage) {
        const source = normalizeSource(cloudFile.source);

        console.log('--- Cloud file ---');
        console.log('name:', cloudFile.name);
        console.log('id:', cloudFile.id);
        console.log('source(raw):', cloudFile.source);
        console.log('source(norm):', source);

        try {
          let downloadedFile = null;

          if (source === 'onedrive') {
            // IMPORTANT: use your fixed OneDrive downloader
            downloadedFile = await downloadFileFromOneDriveFixed(cloudFile.id, cloudFile.name);
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
          showNotification(`Failed to download ${cloudFile.name}: ${error.message}`, 'error');
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


function clearForm() {
  const recipientSelect = document.getElementById('message-recipient');
  const contentTextarea = document.getElementById('message-content');
  if (recipientSelect) recipientSelect.value = '';
  if (contentTextarea) contentTextarea.value = '';
  selectedLocalFiles = [];
  selectedCloudFilesPage = [];
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
  window.switchFileSourcePage = switchFileSourcePage;
  window.loadCloudFilesForPickerPage = loadCloudFilesForPickerPage;
  window.toggleCloudFileSelectionPage = toggleCloudFileSelectionPage;
  window.refreshCloudFilesForPickerPage = refreshCloudFilesForPickerPage;
  window.renderFileList = renderFileList;
  window.removeCloudFile = removeCloudFile;
  window.setQuickSchedule = setQuickSchedule;
  window.submitScheduledMessage = submitScheduledMessage;
  window.clearForm = clearForm;
}
