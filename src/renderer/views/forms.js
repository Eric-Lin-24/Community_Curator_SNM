// ============================================
// FORMS VIEW
// ============================================

function renderForms() {
  const content = document.getElementById('content');
  const forms = AppState.microsoftForms || [];

  content.innerHTML = `
    <div class="animate-slide-up">
      <div class="flex justify-between items-center mb-6">
        <button class="btn btn-secondary" onclick="refreshForms()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Refresh
        </button>
        <button class="btn btn-primary" onclick="showNewFormModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Form
        </button>
      </div>

      ${!AppState.isAuthenticated ? `
        <div class="card mb-6" style="border-left: 3px solid var(--info);">
          <div class="flex items-center gap-4">
            <div class="stat-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
            <div class="flex-1">
              <h4 class="font-semibold">Connect Microsoft Account</h4>
              <p class="text-sm text-muted">Sign in to access your Microsoft Forms.</p>
            </div>
            <button class="btn btn-primary" onclick="MicrosoftGraphAPI.authenticateWithMicrosoft()">Connect Now</button>
          </div>
        </div>
      ` : ''}

      ${forms.length === 0 ? `
        <div class="card">
          <div class="empty-state">
            <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
            <h3>No forms found</h3>
            <p>Create a new form or connect your Microsoft account.</p>
            <button class="btn btn-primary mt-4" onclick="showNewFormModal()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create Form
            </button>
          </div>
        </div>
      ` : `
        <div class="grid grid-cols-3 animate-stagger">
          ${forms.map((form, index) => `
            <div class="card" style="animation: slideUp 0.4s ease ${index * 0.08}s both;">
              <div class="flex justify-between items-start mb-4">
                <span class="badge ${form.isAcceptingResponses ? 'badge-success' : 'badge-error'}">${form.isAcceptingResponses ? 'Active' : 'Closed'}</span>
                <a href="${form.webUrl}" target="_blank" class="btn-icon" style="width: 32px; height: 32px;" title="Open in browser">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>
              <h4 class="font-semibold mb-2" style="color: var(--text-primary);">${form.title}</h4>
              <p class="text-sm text-muted line-clamp-2 mb-4">${form.description || 'No description.'}</p>
              <div class="border-t pt-4 mt-auto">
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-2">
                    <div class="stat-icon purple" style="width: 32px; height: 32px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
                    <div>
                      <p class="text-lg font-bold" style="color: var(--text-primary); line-height: 1;">${form.responseCount || 0}</p>
                      <p class="text-xs text-muted">responses</p>
                    </div>
                  </div>
                  <button class="btn btn-ghost btn-sm" onclick="viewFormResponses('${form.id}')">View Data</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

async function refreshForms() {
  if (!AppState.isAuthenticated) {
    showNotification('Please connect your Microsoft account first', 'warning');
    return;
  }
  showNotification('Loading forms...', 'info');
  try {
    const forms = await MicrosoftGraphAPI.getForms();
    AppState.microsoftForms = forms;
    showNotification(`Loaded ${forms.length} forms`, 'success');
    renderForms();
  } catch (error) {
    console.error('Error loading forms:', error);
    showNotification('Failed to load forms: ' + error.message, 'error');
  }
}

async function viewFormResponses(formId) {
  const form = AppState.microsoftForms.find(f => f.id === formId);
  if (!form) return;
  showNotification('Loading responses...', 'info');
  try {
    const responses = await MicrosoftGraphAPI.getFormResponses(formId);
    showFormResponsesModal(form, responses);
  } catch (error) {
    showNotification('Failed to load responses: ' + error.message, 'error');
  }
}

function showFormResponsesModal(form, responses) {
  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalFooter = document.getElementById('modal-footer');

  modalTitle.textContent = `${form.title} - Responses`;

  modalBody.innerHTML = `
    <p class="text-sm text-muted mb-4">${responses.length} total response${responses.length !== 1 ? 's' : ''}</p>
    ${responses.length === 0 ? `<div class="text-center py-8 text-muted"><p>No responses yet.</p></div>` : `
      <div class="flex flex-col gap-4" style="max-height: 400px; overflow-y: auto;">
        ${responses.map(response => `
          <div class="card" style="padding: 16px;">
            <div class="flex justify-between items-center mb-3">
              <span class="font-medium text-sm">${response.submitter}</span>
              <span class="text-xs text-muted">${formatDateTime(response.submittedDateTime)}</span>
            </div>
            <div class="flex flex-col gap-2">
              ${Object.entries(response.responses).map(([question, answer]) => `
                <div><p class="text-xs text-muted mb-1">${question}</p><p class="text-sm" style="color: var(--text-primary);">${answer}</p></div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;

  modalFooter.innerHTML = `<button class="btn btn-secondary" onclick="closeModal()">Close</button>`;
  modalOverlay.classList.add('active');
}

function showNewFormModal() {
  showNotification('Form creation will open in Microsoft Forms', 'info');
  window.electronAPI?.openExternal?.('https://forms.office.com/') || window.open('https://forms.office.com/', '_blank');
}

if (typeof window !== 'undefined') {
  window.renderForms = renderForms;
  window.refreshForms = refreshForms;
  window.viewFormResponses = viewFormResponses;
  window.showNewFormModal = showNewFormModal;
}