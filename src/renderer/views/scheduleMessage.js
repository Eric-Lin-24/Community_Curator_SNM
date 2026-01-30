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

              <!-- File source tabs -->
              <div class="flex gap-2 mb-4">
                <button type="button" onclick="switchFileSourcePage('local')" id="tab-local-page" class="btn btn-primary btn-sm flex-1">
                  📁 Local Files
                </button>
                <button type="button" onclick="switchFileSourcePage('cloud')" id="tab-cloud-page" class="btn btn-secondary btn-sm flex-1">
                  ☁️ Cloud Storage
                </button>
              </div>

              <!-- Local file upload -->
              <div
                id="file-drop-zone"
                class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all"
                style="border-color: var(--border-default); background: var(--bg-tertiary);"
                onclick="document.getElementById('file-input').click()"
              >
                <input type="file" id="file-input" multiple style="display: none;" onchange="handleLocalFileSelect(event)">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 16px; display: block; color: var(--text-muted);">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p class="text-sm" style="color: var(--text-primary);">Drop files here or click to browse</p>
                <p class="text-xs text-muted mt-2">Supports images, documents, and other files</p>
              </div>

              <!-- Cloud storage file picker (hidden by default) -->
              <div id="cloud-file-section-page" class="hidden border rounded-lg p-4 max-h-60 overflow-y-auto" style="border-color: var(--border-default); background: var(--bg-tertiary);">
                <div class="flex items-center justify-between mb-3">
                  <p class="text-sm font-medium">Select from Cloud Storage</p>
                  <button type="button" onclick="refreshCloudFilesForPickerPage()" class="btn btn-ghost btn-sm">
                    🔄 Refresh
                  </button>
                </div>
                <div id="cloud-file-list-picker-page" class="flex flex-col gap-2">
                  <p class="text-sm text-muted text-center py-4">Loading files...</p>
                </div>
              </div>

              <!-- File List -->
              <div id="file-list" class="mt-4 flex flex-col gap-2"></div>
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

  // Setup drag and drop
  setupDragAndDrop();
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

// Switch file source tabs
function switchFileSourcePage(source) {
  const dropZone = document.getElementById('file-drop-zone');
  const cloudSection = document.getElementById('cloud-file-section-page');
  const tabLocal = document.getElementById('tab-local-page');
  const tabCloud = document.getElementById('tab-cloud-page');

  if (source === 'local') {
    if (dropZone) dropZone.classList.remove('hidden');
    if (cloudSection) cloudSection.classList.add('hidden');
    if (tabLocal) tabLocal.className = 'btn btn-primary btn-sm flex-1';
    if (tabCloud) tabCloud.className = 'btn btn-secondary btn-sm flex-1';
  } else {
    if (dropZone) dropZone.classList.add('hidden');
    if (cloudSection) cloudSection.classList.remove('hidden');
    if (tabLocal) tabLocal.className = 'btn btn-secondary btn-sm flex-1';
    if (tabCloud) tabCloud.className = 'btn btn-primary btn-sm flex-1';
    loadCloudFilesForPickerPage();
  }
}

// Load cloud files
async function loadCloudFilesForPickerPage() {
  const cloudFileList = document.getElementById('cloud-file-list-picker-page');
  if (!cloudFileList) return;

  cloudFileList.innerHTML = '<p class="text-sm text-muted text-center py-4">Loading files...</p>';

  try {
    let files = [];
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

// Toggle cloud file selection
function toggleCloudFileSelectionPage(fileId, fileName, source, mimeType = '') {
  const existingIndex = selectedCloudFilesPage.findIndex(f => f.id === fileId);

  if (existingIndex >= 0) {
    selectedCloudFilesPage.splice(existingIndex, 1);
  } else {
    selectedCloudFilesPage.push({ id: fileId, name: fileName, source: source, mimeType: mimeType });
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
      <button class="btn-icon" onclick="${file.type === 'local' ? `removeLocalFile(${file.index})` : `removeCloudFile('${file.id}')`}" style="width: 32px; height: 32px; color: var(--error);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
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

function saveDraft() { showNotification('Draft saved (feature coming soon)', 'info'); }

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
  window.saveDraft = saveDraft;
  window.clearForm = clearForm;
}
