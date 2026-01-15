// ============================================
// DOCUMENTS VIEW
// ============================================

/**
 * Render the documents view
 * Shows cloud storage documents from OneDrive or Google Drive
 */
function renderDocuments() {
  const content = document.getElementById('content');

  // Documents only come from SharePoint
  if (!AppState.isAuthenticated && !AppState.googleDriveConnected) {
    content.innerHTML = `
      <div class="space-y-6">
        <div>
          <h3 class="text-2xl font-bold text-gray-800">Documents</h3>
          <p class="text-gray-600">Access your cloud documents</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Connect to Cloud Storage</h3>
          <p class="text-gray-600 mb-4">Sign in to access your documents from OneDrive or Google Drive</p>
          <div class="flex gap-3 justify-center">
            <button
              onclick="MicrosoftGraphAPI.authenticateWithMicrosoft()"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign in with Microsoft
            </button>
            <button
              onclick="GoogleDriveAPI.authenticateWithGoogle()"
              class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const documents = AppState.documents;
  const searchQuery = AppState.documentSearchQuery || '';
  const selectedDocs = AppState.selectedDocuments || [];
  const activeSource = AppState.activeDocumentSource || 'onedrive';

  // Filter documents by active source first
  let filteredDocuments = documents.filter(d => d.source === activeSource);

  // Then filter by search query
  if (searchQuery) {
    filteredDocuments = filteredDocuments.filter(d =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.content && d.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  // Determine provider display info
  const isOneDrive = activeSource === 'onedrive';
  const providerName = isOneDrive ? 'OneDrive' : 'Google Drive';
  const syncButtonColor = isOneDrive ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700';

  content.innerHTML = `
    <div class="space-y-6">
      <!-- Storage Provider Switcher -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-gray-800 mb-1">Storage Provider</h3>
            <p class="text-sm text-gray-600">Choose where to manage your documents</p>
          </div>
          <div class="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onclick="switchDocumentSource('onedrive')"
              class="px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                activeSource === 'onedrive'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }"
            >
              OneDrive
            </button>
            <button
              onclick="switchDocumentSource('googledrive')"
              class="px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                activeSource === 'googledrive'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }"
            >
              Google Drive
            </button>
          </div>
        </div>
      </div>

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-2xl font-bold text-gray-800">${providerName} Files</h3>
          <p class="text-gray-600">Your files synced from ${providerName}</p>
        </div>
        <div class="flex gap-2">
          <button
            onclick="refreshCloudDocs()"
            class="flex items-center gap-2 px-4 py-2 ${syncButtonColor} text-white rounded-lg transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Sync ${providerName}</span>
          </button>
          <button
            onclick="showNewDocumentModal()"
            class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Document</span>
          </button>
        </div>
      </div>

      <!-- Search Bar and Bulk Actions -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <div class="relative flex-1">
              <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search documents..."
                value="${searchQuery}"
                onkeydown="handleDocumentSearchKeydown(event, this.value)"
                class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
              />
            </div>
            <select class="px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer h-10" style="min-width: 200px;">
              <option value="">Sort by: Date (Newest)</option>
              <option value="date-oldest">Sort by: Date (Oldest)</option>
              <option value="name-az">Sort by: Name (A-Z)</option>
              <option value="name-za">Sort by: Name (Z-A)</option>
            </select>
            <select class="px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer h-10" style="min-width: 180px;">
              <option value="">Filter: All Types</option>
              <option value="pdf">Filter: PDF</option>
              <option value="doc">Filter: Documents</option>
              <option value="spreadsheet">Filter: Spreadsheets</option>
            </select>
          </div>

          ${selectedDocs.length > 0 ? `
            <div class="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-sm font-medium text-blue-900">${selectedDocs.length} document${selectedDocs.length > 1 ? 's' : ''} selected</span>
              </div>
              <div class="flex gap-2">
                <button
                  onclick="bulkDownloadDocuments()"
                  class="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m3-3v12" />
                  </svg>
                  Download
                </button>
                <button
                  onclick="bulkShareDocuments()"
                  class="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
                <button
                  onclick="bulkDeleteDocuments()"
                  class="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
                <button
                  onclick="clearDocumentSelection()"
                  class="px-3 py-1.5 text-gray-700 text-sm hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      ${filteredDocuments.length === 0 ? `
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="text-xl font-semibold text-gray-800 mb-2">No documents found</h3>
          <p class="text-gray-600 mb-4">Sync your OneDrive or Google Drive to see documents here</p>
          <button
            onclick="refreshCloudDocs()"
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Sync ${providerName}
          </button>
        </div>
      ` : `
        <div class="space-y-3">
          <div class="flex items-center gap-2 px-2">
            <input
              type="checkbox"
              id="select-all-docs"
              ${selectedDocs.length === filteredDocuments.length && filteredDocuments.length > 0 ? 'checked' : ''}
              onchange="toggleSelectAllDocuments(this.checked)"
              class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label for="select-all-docs" class="text-sm font-medium text-gray-700 cursor-pointer">
              Select all (${filteredDocuments.length})
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${filteredDocuments.map(doc => {
              const isGoogleDrive = doc.source === 'googledrive';
              const sourceName = isGoogleDrive ? 'Google Drive' : 'OneDrive';
              const sourceBadgeColor = isGoogleDrive ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';
              const sourceIconColor = isGoogleDrive ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600';
              const buttonColor = isGoogleDrive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';

              return `
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${selectedDocs.includes(doc.id) ? 'ring-2 ring-blue-500' : ''}">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <input
                      type="checkbox"
                      ${selectedDocs.includes(doc.id) ? 'checked' : ''}
                      onchange="toggleDocumentSelection('${doc.id}', this.checked)"
                      class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      onclick="event.stopPropagation()"
                    />
                    <div class="p-2 ${sourceIconColor} rounded-lg">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <span class="text-xs px-2 py-1 rounded ${sourceBadgeColor}">${sourceName}</span>
                </div>

                <h4 class="font-semibold text-gray-800 mb-2">${doc.title}</h4>
                <p class="text-sm text-gray-600 mb-4 line-clamp-3">${doc.content || 'No preview available'}</p>

                <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>${formatDate(doc.created_at)}</span>
                  ${doc.updated_at ? `<span>Updated ${formatDate(doc.updated_at)}</span>` : ''}
                </div>

                <div class="flex items-center gap-2">
                  ${doc.webUrl ? `
                    <a
                      href="${doc.webUrl}"
                      target="_blank"
                      class="flex-1 px-3 py-2 ${buttonColor} text-white rounded-lg transition-colors text-sm text-center"
                    >
                      Open in ${sourceName}
                    </a>
                  ` : `
                    <button
                      onclick="viewDocument('${doc.id}')"
                      class="flex-1 px-3 py-2 ${buttonColor} text-white rounded-lg transition-colors text-sm"
                    >
                      View
                    </button>
                  `}
                </div>
              </div>
            `;
            }).join('')}
          </div>
        </div>
      `}
    </div>
  `;
}

/**
 * Handle keydown event in document search input
 * Only triggers search when Enter key is pressed or when input is cleared
 * @param {KeyboardEvent} event - Keyboard event
 * @param {string} value - Current input value
 */
function handleDocumentSearchKeydown(event, value) {
  if (event.key === 'Enter') {
    event.preventDefault();
    updateDocumentSearch(value);
  } else if (event.key === 'Backspace' || event.key === 'Delete') {
    // If user is clearing the search, update on next tick to get the actual value
    setTimeout(() => {
      const inputElement = event.target;
      if (inputElement.value === '') {
        updateDocumentSearch('');
      }
    }, 0);
  }
}

/**
 * Update document search query and re-render
 * @param {string} query - Search query string
 */
function updateDocumentSearch(query) {
  AppState.documentSearchQuery = query;
  renderDocuments();
}

/**
 * Toggle selection of a single document
 * @param {string} docId - Document ID
 * @param {boolean} isChecked - Whether the checkbox is checked
 */
function toggleDocumentSelection(docId, isChecked) {
  if (!AppState.selectedDocuments) {
    AppState.selectedDocuments = [];
  }

  if (isChecked) {
    if (!AppState.selectedDocuments.includes(docId)) {
      AppState.selectedDocuments.push(docId);
    }
  } else {
    AppState.selectedDocuments = AppState.selectedDocuments.filter(id => id !== docId);
  }

  renderDocuments();
}

/**
 * Toggle selection of all filtered documents
 * @param {boolean} isChecked - Whether to select or deselect all
 */
function toggleSelectAllDocuments(isChecked) {
  const documents = AppState.documents;
  const searchQuery = AppState.documentSearchQuery || '';

  let filteredDocuments = documents;
  if (searchQuery) {
    filteredDocuments = filteredDocuments.filter(d =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (isChecked) {
    AppState.selectedDocuments = filteredDocuments.map(d => d.id);
  } else {
    AppState.selectedDocuments = [];
  }

  renderDocuments();
}

/**
 * Clear all document selections
 */
function clearDocumentSelection() {
  AppState.selectedDocuments = [];
  renderDocuments();
}

/**
 * Download selected documents
 */
function bulkDownloadDocuments() {
  const selectedDocs = AppState.selectedDocuments || [];
  if (selectedDocs.length === 0) {
    alert('No documents selected');
    return;
  }

  const docs = AppState.documents.filter(d => selectedDocs.includes(d.id));
  alert(`Downloading ${docs.length} document${docs.length > 1 ? 's' : ''}...\n\n${docs.map(d => '• ' + d.title).join('\n')}`);

  // In a real app, this would trigger actual downloads
  console.log('Bulk download:', docs);
}

/**
 * Share selected documents
 */
function bulkShareDocuments() {
  const selectedDocs = AppState.selectedDocuments || [];
  if (selectedDocs.length === 0) {
    alert('No documents selected');
    return;
  }

  const docs = AppState.documents.filter(d => selectedDocs.includes(d.id));
  const recipient = prompt(`Share ${docs.length} document${docs.length > 1 ? 's' : ''} with (email):`);

  if (recipient) {
    alert(`Sharing ${docs.length} document${docs.length > 1 ? 's' : ''} with ${recipient}...\n\n${docs.map(d => '• ' + d.title).join('\n')}`);
    console.log('Bulk share:', docs, 'to', recipient);
  }
}

/**
 * Delete selected documents
 */
function bulkDeleteDocuments() {
  const selectedDocs = AppState.selectedDocuments || [];
  if (selectedDocs.length === 0) {
    alert('No documents selected');
    return;
  }

  const docs = AppState.documents.filter(d => selectedDocs.includes(d.id));

  if (confirm(`Are you sure you want to delete ${docs.length} document${docs.length > 1 ? 's' : ''}?\n\n${docs.map(d => '• ' + d.title).join('\n')}`)) {
    AppState.documents = AppState.documents.filter(d => !selectedDocs.includes(d.id));
    AppState.selectedDocuments = [];
    renderDocuments();
    alert(`${docs.length} document${docs.length > 1 ? 's' : ''} deleted successfully`);
  }
}

/**
 * View a specific document
 * @param {string} docId - Document ID
 */
function viewDocument(docId) {
  const doc = AppState.documents.find(d => d.id === docId);
  if (doc && doc.webUrl) {
    window.open(doc.webUrl, '_blank');
  } else {
    alert('Document URL not available');
  }
}

/**
 * Show modal for creating a new document
 */
function showNewDocumentModal() {
  const modalHtml = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target === this) closeNewDocumentModal()">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 mx-4">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Create Document in OneDrive</h3>
          <p class="text-gray-600 mb-6">Documents are managed in Microsoft OneDrive. Click below to open OneDrive and create a new document.</p>

          <div class="space-y-3">
            <button
              onclick="openSharePointNewDocument()"
              class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
              <span>Open OneDrive</span>
            </button>

            <button
              type="button"
              onclick="closeNewDocumentModal()"
              class="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>

          <p class="text-xs text-center text-gray-500">After creating your document, click "Sync OneDrive" to see it here.</p>
        </div>
      </div>
    </div>
  `;

  const modalContainer = document.createElement('div');
  modalContainer.id = 'new-doc-modal';
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);
}

/**
 * Close new document modal
 */
function closeNewDocumentModal() {
  const modal = document.getElementById('new-doc-modal');
  if (modal) {
    modal.remove();
  }
}

/**
 * Open SharePoint to create a new document
 */
function openSharePointNewDocument() {
  // Open SharePoint in browser to create a new document
  const sharePointUrl = 'https://www.office.com/launch/sharepoint';

  // Open in external browser
  window.open(sharePointUrl, '_blank');

  closeNewDocumentModal();

  // Show a message to remind user to sync after creating
  setTimeout(() => {
    alert('After creating your document in SharePoint, click "Sync OneDrive" to see it in the app.');
  }, 500);
}

/**
 * Open OneDrive to create a new document
 */
function openOneDriveNewDocument() {
  // Open OneDrive in browser to create a new document
  const oneDriveUrl = 'https://www.office.com/launch/onedrive';

  // Open in external browser
  window.open(oneDriveUrl, '_blank');

  closeNewDocumentModal();

  // Show a message to remind user to sync after creating
  setTimeout(() => {
    alert('After creating your document in OneDrive, click "Sync OneDrive" to see it in the app.');
  }, 500);
}
