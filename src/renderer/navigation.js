// ============================================
// NAVIGATION MODULE
// View routing and rendering orchestration
// ============================================

const viewMeta = {
  dashboard: {
    title: 'Dashboard',
    subtitle: "Welcome back! Here's your overview."
  },
  documents: {
    title: 'Documents',
    subtitle: 'Manage and sync your cloud files.'
  },
  scheduling: {
    title: 'Messages',
    subtitle: 'Schedule and manage automated updates.'
  },
  scheduleMessage: {
    title: 'Compose Message',
    subtitle: 'Draft a new update for your community.'
  },
  settings: {
    title: 'Settings',
    subtitle: 'Configure platform connections and preferences.'
  }
};

function navigateTo(view) {
  AppState.currentView = view;

  const content = document.getElementById('content');

  if (content) {
    content.style.opacity = '0';
    content.style.transform = 'translateY(10px)';
    content.style.transition = 'opacity 0.15s ease, transform 0.15s ease';

    setTimeout(() => {
      renderApp();

      requestAnimationFrame(() => {
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
      });
    }, 150);
  } else {
    renderApp();
  }
}

function renderApp() {
  // Update Sidebar Active State
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    if (item.dataset.view === AppState.currentView) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update Header
  const currentMeta = viewMeta[AppState.currentView] || viewMeta.dashboard;

  const titleEl = document.getElementById('view-title');
  const subEl = document.getElementById('view-subtitle');

  if (titleEl) titleEl.textContent = currentMeta.title;
  if (subEl) subEl.textContent = currentMeta.subtitle;

  // Update message badge
  const messageBadge = document.getElementById('message-badge');
  if (messageBadge) {
    const pendingCount = AppState.scheduledMessages.filter(m => m.status !== 'sent').length;
    if (pendingCount > 0) {
      messageBadge.textContent = pendingCount;
      messageBadge.style.display = 'block';
    } else {
      messageBadge.style.display = 'none';
    }
  }

  // Update user card
  if (typeof updateUserCard === 'function') {
    updateUserCard();
  }

  // Render the specific view
  switch (AppState.currentView) {
    case 'dashboard':
      if (typeof renderDashboard === 'function') renderDashboard();
      break;
    case 'documents':
      if (typeof renderDocuments === 'function') renderDocuments();
      break;
    case 'scheduling':
      if (typeof renderScheduling === 'function') renderScheduling();
      break;
    case 'scheduleMessage':
      if (typeof renderScheduleMessagePage === 'function') {
        renderScheduleMessagePage();
      } else {
        AppState.currentView = 'scheduling';
        if (typeof renderScheduling === 'function') renderScheduling();
      }
      break;
    case 'settings':
      if (typeof renderSettings === 'function') renderSettings();
      break;
    default:
      AppState.currentView = 'dashboard';
      if (typeof renderDashboard === 'function') renderDashboard();
  }
}

function refreshCurrentView() {
  showNotification('Refreshing...', 'info');

  switch (AppState.currentView) {
    case 'documents':
      if (typeof refreshCloudDocs === 'function') refreshCloudDocs();
      break;
    case 'scheduling':
      AzureVMAPI.refreshSubscribedChats();
      break;
    default:
      renderApp();
      showNotification('Refreshed', 'success');
  }
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.navigateTo = navigateTo;
  window.renderApp = renderApp;
  window.refreshCurrentView = refreshCurrentView;
}