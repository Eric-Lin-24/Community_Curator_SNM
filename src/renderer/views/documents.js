// ============================================
// DOCUMENTS VIEW (TABS + FOLDER NAVIGATION)
// ============================================

function isFolderDoc(doc) {
  if (!doc) return false;
  // OneDrive mapping often uses "folder" or doc.folder presence.
  if (doc.mimeType === 'folder') return true;
  // Google Drive folder mime type
  if (doc.mimeType === 'application/vnd.google-apps.folder') return true;
  // fallback
  if (doc.folder) return true;
  return false;
}

function setActiveDocumentSource(source) {
  AppState.activeDocumentSource = source;
  renderDocuments();
}

function getDocsForActiveSource() {
  const src = AppState.activeDocumentSource || 'onedrive';
  const docs = AppState.documents || [];
  return docs.filter(d => (d.source || 'onedrive') === src);
}

function getFolderState() {
  const src = AppState.activeDocumentSource || 'onedrive';
  if (!AppState.documentNav) AppState.documentNav = {};
  if (!AppState.documentNav[src]) AppState.documentNav[src] = { folderId: 'root', stack: [] };
  return AppState.documentNav[src];
}

async function openFolder(folderId, folderName) {
  const src = AppState.activeDocumentSource || 'onedrive';
  const nav = getFolderState();
  nav.stack.push({ folderId: nav.folderId, name: folderName || 'Folder' });
  nav.folderId = folderId;

  await refreshCloudDocs({ source: src, folderId });
  renderDocuments();
}

async function goBackFolder() {
  const src = AppState.activeDocumentSource || 'onedrive';
  const nav = getFolderState();
  if (!nav.stack.length) return;

  const prev = nav.stack.pop();
  nav.folderId = prev.folderId || 'root';

  await refreshCloudDocs({ source: src, folderId: nav.folderId });
  renderDocuments();
}

function resetToRoot() {
  const src = AppState.activeDocumentSource || 'onedrive';
  const nav = getFolderState();
  nav.folderId = 'root';
  nav.stack = [];
  refreshCloudDocs({ source: src, folderId: 'root' });
  renderDocuments();
}

// Debounce timer for search
let documentSearchDebounceTimer = null;

function updateDocumentSearch(query) {
  AppState.documentSearchQuery = query || '';

  // Debounce to avoid re-rendering on every keystroke
  if (documentSearchDebounceTimer) {
    clearTimeout(documentSearchDebounceTimer);
  }

  documentSearchDebounceTimer = setTimeout(() => {
    // Only update the document grid, not the entire page
    updateDocumentGrid();
  }, 100); // 100ms debounce delay
}

// Update only the document grid without re-rendering the whole page
function updateDocumentGrid() {
  const gridContainer = document.getElementById('documents-grid');
  if (!gridContainer) {
    // Fallback to full render if grid not found
    renderDocuments();
    return;
  }

  const src = AppState.activeDocumentSource || 'onedrive';
  const nav = getFolderState();

  let documents = getDocsForActiveSource();

  // Search filtering
  const q = (AppState.documentSearchQuery || '').trim().toLowerCase();
  if (q) {
    documents = documents.filter(d =>
      (d.title || '').toLowerCase().includes(q) ||
      (d.content || '').toLowerCase().includes(q)
    );
  }

  // Folder-first ordering
  documents = documents.slice().sort((a, b) => {
    const af = isFolderDoc(a) ? 0 : 1;
    const bf = isFolderDoc(b) ? 0 : 1;
    if (af !== bf) return af - bf;
    return (a.title || '').localeCompare(b.title || '');
  });

  gridContainer.innerHTML = renderDocumentGridContent(documents, src, nav, q);
}

// Helper function to generate just the grid content
function renderDocumentGridContent(documents, src, nav, q) {
  if (documents.length === 0) {
    return `
      <div class="card" style="grid-column: span 3; text-align: center; padding: 60px;">
        <div class="flex justify-center mb-4">
          <div class="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
            <svg width="32" height="32" class="text-muted" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
        </div>
        <h3 class="text-lg font-medium mb-2">No items here</h3>
        <p class="text-muted mb-6">${q ? 'Try a different search term.' : 'Sync your cloud storage to load items.'}</p>
        <button onclick="refreshCloudDocs({ source: '${src}', folderId: '${nav.folderId || 'root'}' })" class="btn btn-primary">Sync Now</button>
      </div>
    `;
  }

  return documents.map(doc => {
    const folder = isFolderDoc(doc);
    const title = (doc.title || 'Untitled').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const meta = folder ? 'Folder' : (doc.mimeType || 'File');
    const rightAction = folder
      ? `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openFolder('${doc.id}', '${title.replace(/'/g, "\\'")}')">Open</button>`
      : (doc.webUrl
          ? `<a class="btn btn-secondary btn-sm" href="${doc.webUrl}" target="_blank" onclick="event.stopPropagation();">Open</a>`
          : `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); viewDocument('${doc.id}')">View</button>`);

    const icon = folder
      ? `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
           <path d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
         </svg>`
      : `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
           <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
           <polyline points="14 2 14 8 20 8"/>
         </svg>`;

    return `
      <div class="card hover:border-primary/50 group cursor-pointer"
           onclick="${folder ? `openFolder('${doc.id}', '${title.replace(/'/g, "\\'")}')` : `viewDocument('${doc.id}')`}">
        <div class="flex justify-between items-start mb-4">
          <div class="flex gap-3 items-center">
            <div class="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center text-primary">
              ${icon}
            </div>
            <div>
              <div class="font-medium">${title}</div>
              <div class="text-xs text-muted">${meta}</div>
            </div>
          </div>
          ${rightAction}
        </div>

        <div class="text-xs text-muted">
          ${doc.updated_at ? `Updated: ${new Date(doc.updated_at).toLocaleString()}` : (doc.created_at ? `Added: ${new Date(doc.created_at).toLocaleString()}` : '')}
        </div>
      </div>
    `;
  }).join('');
}

function renderDocuments() {
  const content = document.getElementById('content');
  const src = AppState.activeDocumentSource || 'onedrive';
  const nav = getFolderState();

  let documents = getDocsForActiveSource();

  // Search filtering
  const q = (AppState.documentSearchQuery || '').trim().toLowerCase();
  if (q) {
    documents = documents.filter(d =>
      (d.title || '').toLowerCase().includes(q) ||
      (d.content || '').toLowerCase().includes(q)
    );
  }

  // Folder-first ordering
  documents = documents.slice().sort((a, b) => {
    const af = isFolderDoc(a) ? 0 : 1;
    const bf = isFolderDoc(b) ? 0 : 1;
    if (af !== bf) return af - bf;
    return (a.title || '').localeCompare(b.title || '');
  });

  const isOneDrive = src === 'onedrive';
  const tabOneDriveClass = isOneDrive ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';
  const tabGoogleClass = !isOneDrive ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';

  const breadcrumb = (nav.stack || []).map((x, idx) => {
    const safeName = (x.name || 'Folder').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<span class="text-muted">/</span><span class="text-sm">${safeName}</span>`;
  }).join(' ');

  content.innerHTML = `
    <div class="animate-in">

      <div class="flex justify-between items-center mb-6">
        <div class="flex gap-2">
          <button class="${tabOneDriveClass}" onclick="setActiveDocumentSource('onedrive')">
            OneDrive
          </button>
          <button class="${tabGoogleClass}" onclick="setActiveDocumentSource('googledrive')">
            Google Drive
          </button>

          <div style="width: 16px;"></div>

          <div class="flex gap-2">
            <input
              type="text"
              placeholder="Search documents."
              style="width: 300px;"
              value="${(AppState.documentSearchQuery || '').replace(/"/g, '&quot;')}"
              oninput="updateDocumentSearch(this.value)"
            >
            <!-- ✅ FIXED: use refreshCurrentView so loader shows -->
            <button class="btn btn-secondary btn-sm" onclick="refreshCurrentView()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Sync
            </button>
          </div>
        </div>

        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" onclick="resetToRoot()">
            Root
          </button>
          <button class="btn btn-secondary btn-sm" onclick="goBackFolder()" ${nav.stack.length ? '' : 'disabled style="opacity:0.5;cursor:not-allowed;"'}>
            Back
          </button>
          <button onclick="showNewDocumentModal()" class="btn btn-primary btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Upload
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2 mb-4">
        <span class="text-xs text-muted">Location:</span>
        <span class="text-sm">${src === 'onedrive' ? 'OneDrive' : 'Google Drive'}</span>
        <span class="text-muted">/</span>
        <span class="text-sm">${nav.folderId === 'root' ? 'Root' : 'Folder'}</span>
        <span class="text-muted">${breadcrumb ? breadcrumb : ''}</span>
      </div>

      <div id="documents-grid" class="grid-cols-3">
        ${renderDocumentGridContent(documents, src, nav, q)}
      </div>
    </div>
  `;
}

// Export
if (typeof window !== 'undefined') {
  window.renderDocuments = renderDocuments;
  window.setActiveDocumentSource = setActiveDocumentSource;
  window.openFolder = openFolder;
  window.goBackFolder = goBackFolder;
  window.resetToRoot = resetToRoot;
  window.updateDocumentSearch = updateDocumentSearch;
  window.updateDocumentGrid = updateDocumentGrid;
  window.renderDocumentGridContent = renderDocumentGridContent;
}
