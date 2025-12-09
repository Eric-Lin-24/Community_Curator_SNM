// Navigation Module
// Handles navigation between views and sidebar toggling

/**
 * Navigate to a specific view
 * @param {string} view - The view to navigate to (dashboard, documents, scheduling, forms, settings)
 */
function navigateTo(view) {
  AppState.currentView = view;
  renderApp();
}

/**
 * Toggle the sidebar visibility
 */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('hidden');
}

/**
 * Main app rendering function
 * Updates the active navigation item, page title, and renders the current view
 */
function renderApp() {
  const contentArea = document.getElementById('content');
  const navItems = document.querySelectorAll('.nav-item');

  // Update active nav item
  navItems.forEach(item => {
    if (item.dataset.view === AppState.currentView) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update header with consistent titles
  const titles = {
    dashboard: { title: 'Dashboard', subtitle: 'Welcome back! Here\'s an overview of your community platform' },
    documents: { title: 'Documents', subtitle: 'Manage and sync your OneDrive files' },
    scheduling: { title: 'Message Scheduling', subtitle: 'Schedule and manage automated messages' },
    scheduleMessage: { title: 'Schedule Message', subtitle: 'Create and schedule a new message' },
    forms: { title: 'Microsoft Forms', subtitle: 'Create forms and view responses' },
    settings: { title: 'Settings', subtitle: 'Configure your application preferences' }
  };

  const header = titles[AppState.currentView];
  document.getElementById('view-title').textContent = header.title;
  document.getElementById('view-subtitle').textContent = header.subtitle;

  // Render content based on view
  switch (AppState.currentView) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'documents':
      renderDocuments();
      break;
    case 'scheduling':
      renderScheduling();
      break;
    case 'scheduleMessage':
      renderScheduleMessagePage();
      break;
    case 'forms':
      renderForms();
      break;
    case 'settings':
      renderSettings();
      break;
    default:
      renderDashboard();
  }
}

// Export functions to global scope
if (typeof window !== 'undefined') {
  window.navigateTo = navigateTo;
  window.toggleSidebar = toggleSidebar;
  window.renderApp = renderApp;
}
