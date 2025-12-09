// ============================================
// FORMS VIEW
// ============================================

/**
 * Render the forms view
 * Shows Microsoft Forms and their responses
 */
function renderForms() {
  const content = document.getElementById('content');

  if (!AppState.isAuthenticated) {
    content.innerHTML = `
      <div class="space-y-6">
        <div>
          <h3 class="text-2xl font-bold text-gray-800">Microsoft Forms</h3>
          <p class="text-gray-600">Create forms and view responses</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Connect to Microsoft 365</h3>
          <p class="text-gray-600 mb-4">Sign in to access your Microsoft Forms</p>
          <button
            onclick="MicrosoftGraphAPI.authenticateWithMicrosoft()"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign in with Microsoft
          </button>
        </div>
      </div>
    `;
    return;
  }

  const forms = AppState.microsoftForms;

  content.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-2xl font-bold text-gray-800">Microsoft Forms</h3>
          <p class="text-gray-600">Manage your forms and view responses</p>
        </div>
        <div class="flex gap-2">
          <button
            onclick="refreshForms()"
            class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Forms</span>
          </button>
          <button
            onclick="showNewFormModal()"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Form</span>
          </button>
        </div>
      </div>

      ${forms.length === 0 ? `
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 class="text-xl font-semibold text-gray-800 mb-2">No forms found</h3>
          <p class="text-gray-600 mb-4">Refresh to load forms or create your first form in Microsoft Forms</p>
          <button
            onclick="refreshForms()"
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Refresh Forms
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${forms.map(form => `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between mb-3">
                <div class="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                </div>
                <span class="text-xs px-2 py-1 rounded ${form.isAcceptingResponses ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}">
                  ${form.isAcceptingResponses ? 'Active' : 'Closed'}
                </span>
              </div>

              <h4 class="font-semibold text-gray-800 mb-2">${form.title}</h4>
              <p class="text-sm text-gray-600 mb-4 line-clamp-2">${form.description}</p>

              <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
                <div class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
                  </svg>
                  <span>${form.responseCount} responses</span>
                </div>
                <span>${formatDate(form.createdDateTime)}</span>
              </div>

              <div class="flex items-center gap-2">
                <button
                  onclick="viewFormResponses('${form.id}')"
                  class="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  View Responses
                </button>
                <button
                  onclick="window.open('${form.webUrl}', '_blank')"
                  class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  title="Open Form"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

/**
 * Refresh Microsoft Forms list
 */
async function refreshForms() {
  if (!AppState.isAuthenticated) {
    alert('Please sign in with Microsoft 365 first.');
    return;
  }

  alert('Refreshing Microsoft Forms...');

  // Reload forms from Microsoft Graph API
  AppState.microsoftForms = await MicrosoftGraphAPI.getForms();

  // Re-render the forms view
  renderForms();
}

/**
 * Show modal for creating a new form
 */
function showNewFormModal() {
  const modalHtml = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target === this) closeNewFormModal()">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 mx-4">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
            <svg class="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Create Form in Microsoft Forms</h3>
          <p class="text-gray-600 mb-6">Forms are managed in Microsoft Forms. Click below to open Microsoft Forms and create a new form.</p>

          <div class="space-y-3">
            <button
              onclick="openMicrosoftForms()"
              class="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
              <span>Open Microsoft Forms</span>
            </button>

            <button
              type="button"
              onclick="closeNewFormModal()"
              class="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>

          <p class="text-xs text-center text-gray-500">After creating your form, click "Refresh Forms" to see it here.</p>
        </div>
      </div>
    </div>
  `;

  const modalContainer = document.createElement('div');
  modalContainer.id = 'new-form-modal';
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);
}

/**
 * Close new form modal
 */
function closeNewFormModal() {
  const modal = document.getElementById('new-form-modal');
  if (modal) {
    modal.remove();
  }
}

/**
 * Open Microsoft Forms in browser
 */
function openMicrosoftForms() {
  // Open Microsoft Forms in browser to create a new form
  const formsUrl = 'https://forms.office.com';

  // Open in external browser
  window.open(formsUrl, '_blank');

  closeNewFormModal();

  // Show a message to remind user to refresh after creating
  setTimeout(() => {
    alert('After creating your form in Microsoft Forms, click "Refresh Forms" to see it here.');
  }, 500);
}

/**
 * View responses for a specific form
 * @param {string} formId - Form ID
 */
async function viewFormResponses(formId) {
  const form = AppState.microsoftForms.find(f => f.id === formId);
  if (!form) return;

  // Get responses for this form
  const responses = await MicrosoftGraphAPI.getFormResponses(formId);

  const modalHtml = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target === this) closeResponsesModal()">
      <div class="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden mx-4">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-semibold text-gray-800">${form.title}</h3>
              <p class="text-sm text-gray-600">${responses.length} responses</p>
            </div>
            <button
              onclick="closeResponsesModal()"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>
          </div>
        </div>

        <div class="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          ${responses.length === 0 ? `
            <div class="text-center py-12 text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 01-2 2z" />
              </svg>
              <p class="text-sm">No responses yet</p>
            </div>
          ` : `
            <div class="space-y-4">
              ${responses.map((response, index) => `
                <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-medium text-gray-700">Response #${index + 1}</span>
                    <div class="text-xs text-gray-500">
                      <span>${response.submitter}</span>
                      <span class="mx-2">•</span>
                      <span>${formatDateTime(response.submittedDateTime)}</span>
                    </div>
                  </div>
                  <div class="space-y-2">
                    ${Object.entries(response.responses).map(([question, answer]) => `
                      <div class="bg-white p-3 rounded border border-gray-100">
                        <p class="text-sm font-medium text-gray-700 mb-1">${question}</p>
                        <p class="text-sm text-gray-600">${answer}</p>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  const modalContainer = document.createElement('div');
  modalContainer.id = 'responses-modal';
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);
}

/**
 * Close form responses modal
 */
function closeResponsesModal() {
  const modal = document.getElementById('responses-modal');
  if (modal) {
    modal.remove();
  }
}
