// ============================================
// COMMUNITY CURATOR - Main Application Entry Point
// Orchestrates initialization and event listeners
// ============================================

// ============================================
// AUTHENTICATION EVENT LISTENERS
// ============================================

// Check if electronAPI exists (it won't in browser testing)
if (typeof window.electronAPI !== 'undefined') {
  // Microsoft authentication events
  window.electronAPI.onAuthSuccess(() => {
    console.log('Authentication successful - checking status');
    MicrosoftGraphAPI.checkAuthentication();
  });

  window.electronAPI.onAuthError((error) => {
    console.error('Authentication error:', error);
    showNotification('Authentication failed: ' + error, 'error');
  });

  // Google authentication events
  window.electronAPI.onGoogleAuthSuccess((data) => {
    console.log('Google authentication successful:', data);
    AppState.googleDriveConnected = true;
    AppState.googleDriveEmail = data.email;
    showNotification(`Connected to Google Drive: ${data.email}`, 'success');
    renderApp();
  });

  window.electronAPI.onGoogleAuthError((error) => {
    console.error('Google authentication error:', error);
    showNotification('Google authentication failed: ' + error, 'error');
  });
} else {
  console.warn('electronAPI not available - running in browser mode');
}

// ============================================
// INITIALIZATION HELPERS
// ============================================

/**
 * Initialize subscribed chats from Azure VM
 */
async function initializeSubscribedChats() {
  // Load saved Azure VM URL from localStorage
  const savedUrl = localStorage.getItem('azureVmUrl');
  if (savedUrl) {
    AppState.azureVmUrl = savedUrl;
  }

  try {
    await AzureVMAPI.fetchSubscribedChats();
    console.log(`Loaded ${AppState.subscribedChats.length} subscribed chats`);
  } catch (error) {
    console.warn('Could not fetch subscribed chats:', error.message);
  }
}

/**
 * Load Microsoft Forms
 */
async function loadForms() {
  if (AppState.isAuthenticated) {
    try {
      AppState.microsoftForms = await MicrosoftGraphAPI.getForms();
    } catch (error) {
      console.error('Error loading forms:', error);
    }
  }
}

// ============================================
// MODAL FUNCTIONS
// ============================================

/**
 * Close the modal
 */
function closeModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }
}

/**
 * Show a modal
 * @param {string} type - Modal type
 */
function showModal(type) {
  switch (type) {
    case 'newMessage':
      navigateTo('scheduleMessage');
      return;
    default:
      console.warn('Unknown modal type:', type);
      return;
  }
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') {
    closeModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// ============================================
// APP STARTUP
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Community Curator starting...');

  // Initialize theme
  if (typeof initializeTheme === 'function') {
    initializeTheme();
  }

  // Always show login screen on startup - no persistent sessions
  console.log('⚠️ Please sign in to continue');
  renderLoginScreen();
});

// Export to global scope
if (typeof window !== 'undefined') {
  window.closeModal = closeModal;
  window.showModal = showModal;
  window.initializeSubscribedChats = initializeSubscribedChats;
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Restore the main app layout (sidebar + header + content area)
 * Called after successful login
 */
function restoreAppLayout() {
  const appContainer = document.querySelector('.app-layout') || document.querySelector('.app-container') || document.body;
  
  appContainer.innerHTML = `
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="brand-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">Curator</span>
          <span class="brand-tagline">Community Platform</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <span class="nav-section-title">Main Menu</span>

        <button class="nav-item active" data-view="dashboard" onclick="navigateTo('dashboard')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Dashboard</span>
        </button>

        <button class="nav-item" data-view="documents" onclick="navigateTo('documents')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span>Documents</span>
        </button>

        <button class="nav-item" data-view="scheduling" onclick="navigateTo('scheduling')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Messages</span>
          <span class="nav-badge" id="message-badge" style="display: none;">0</span>
        </button>

        <button class="nav-item" data-view="forms" onclick="navigateTo('forms')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <span>Forms</span>
        </button>

        <span class="nav-section-title">System</span>

        <button class="nav-item" data-view="settings" onclick="navigateTo('settings')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>Settings</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card" id="user-card" onclick="navigateTo('settings')">
          <div class="user-avatar" id="user-avatar">?</div>
          <div class="user-info">
            <div class="user-name" id="user-name">Not Connected</div>
            <div class="user-status" id="user-status">
              <span>Click to connect</span>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title" id="view-title">Dashboard</h1>
          <p class="page-subtitle" id="view-subtitle">Welcome back! Here's your overview.</p>
        </div>
        <div class="header-right">
          <div class="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search..." id="global-search">
          </div>
          <button class="icon-btn" onclick="refreshCurrentView()" title="Refresh">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          <button class="icon-btn" id="notifications-btn" title="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
        </div>
      </header>

      <div class="scroll-area" id="content">
        <!-- Dynamic content will be rendered here -->
      </div>
    </main>
  `;

  console.log('✓ App layout restored');
}

/**
 * Render the login/signup screen
 */
function renderLoginScreen() {
  const appContainer = document.querySelector('.app-layout') || document.querySelector('.app-container') || document.body;
  appContainer.innerHTML = `
    <div class="login-screen">
      <div class="login-container">
        <div class="login-header">
          <div class="logo-container">
            <svg class="logo-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v7.72c0 4.7-3.07 9.09-7.5 10.5-.28-.08-.56-.17-.83-.27C7.67 24.15 4 19.77 4 14.5V7.78l8-3.6z"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
            </svg>
          </div>
          <h1 class="login-title">Community Curator</h1>
          <p class="login-subtitle">SNM Platform</p>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab active" onclick="showAuthTab('signin')">Sign In</button>
          <button class="auth-tab" onclick="showAuthTab('signup')">Sign Up</button>
        </div>

        <!-- Sign In Form -->
        <div id="signin-form" class="auth-form active">
          <h2 class="auth-heading">Welcome Back</h2>
          <p class="auth-description">Sign in to your account to continue</p>

          <form onsubmit="handleSignIn(event)">
            <div class="form-group">
              <label for="signin-username">Username</label>
              <input
                type="text"
                id="signin-username"
                name="username"
                required
                placeholder="Enter your username"
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <label for="signin-password">Password</label>
              <input
                type="password"
                id="signin-password"
                name="password"
                required
                placeholder="Enter your password"
                autocomplete="current-password"
              />
            </div>

            <div id="signin-error" class="auth-error hidden"></div>

            <button type="submit" class="auth-button" id="signin-button">
              <span>Sign In</span>
            </button>
          </form>
        </div>

        <!-- Sign Up Form -->
        <div id="signup-form" class="auth-form">
          <h2 class="auth-heading">Create Account</h2>
          <p class="auth-description">Sign up to start managing your community</p>

          <form onsubmit="handleSignUp(event)">
            <div class="form-group">
              <label for="signup-username">Username</label>
              <input
                type="text"
                id="signup-username"
                name="username"
                required
                placeholder="Choose a username"
                autocomplete="username"
                minlength="3"
              />
            </div>

            <div class="form-group">
              <label for="signup-password">Password</label>
              <input
                type="password"
                id="signup-password"
                name="password"
                required
                placeholder="Choose a password"
                autocomplete="new-password"
                minlength="6"
              />
            </div>

            <div class="form-group">
              <label for="signup-password-confirm">Confirm Password</label>
              <input
                type="password"
                id="signup-password-confirm"
                name="password_confirm"
                required
                placeholder="Confirm your password"
                autocomplete="new-password"
                minlength="6"
              />
            </div>

            <div id="signup-error" class="auth-error hidden"></div>

            <button type="submit" class="auth-button" id="signup-button">
              <span>Sign Up</span>
            </button>
          </form>
        </div>

        <div class="login-footer">
          <p class="footer-title">Open Source</p>
          <p class="footer-subtitle">Built for UCL & Charities</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Switch between sign in and sign up tabs
 */
function showAuthTab(tab) {
  const tabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('.auth-form');

  tabs.forEach(t => t.classList.remove('active'));
  forms.forEach(f => f.classList.remove('active'));

  const activeTab = document.querySelector(`.auth-tab[onclick*="${tab}"]`);
  const activeForm = document.getElementById(`${tab}-form`);

  if (activeTab) activeTab.classList.add('active');
  if (activeForm) activeForm.classList.add('active');

  // Clear any error messages
  document.querySelectorAll('.auth-error').forEach(el => {
    el.classList.add('hidden');
    el.textContent = '';
  });
}

/**
 * Handle sign in form submission
 */
async function handleSignIn(event) {
  event.preventDefault();

  const button = document.getElementById('signin-button');
  const errorDiv = document.getElementById('signin-error');
  const form = event.target;

  const username = form.username.value.trim();
  const password = form.password.value;

  if (!username || !password) {
    errorDiv.textContent = 'Please fill in all fields';
    errorDiv.classList.remove('hidden');
    return;
  }

  // Show loading state
  button.disabled = true;
  button.innerHTML = '<span>Signing in...</span>';
  errorDiv.classList.add('hidden');

  try {
    console.log('🔐 Attempting sign in for user:', username);

    const response = await fetch(`${AppState.authenticationUrl}/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    if (!response.ok) {
      let errorMessage = 'Sign in failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✓ Sign in successful:', data);
    console.log('✓ Response data:', JSON.stringify(data, null, 2));

    // Save user data in memory only (not persisted)
    // The backend returns 'uuid' field, not 'user_id'
    AppState.userId = data.uuid || data.user_id || data.id; // Support multiple field names for compatibility
    AppState.username = data.username;

    console.log('✓ User logged in:', AppState.username);
    console.log('✓ User ID set to:', AppState.userId);

    // ============================================
    // RESTORE SAVED INTEGRATIONS FOR THIS USER
    // ============================================
    console.log('\n🔍 Checking for saved integrations for user:', AppState.userId);

    // Check for Microsoft credentials
    const userMsTokenKey = `ms_token_${AppState.userId}`;
    const userMsProfileKey = `ms_profile_${AppState.userId}`;
    const savedMsToken = localStorage.getItem(userMsTokenKey);
    const savedMsProfile = localStorage.getItem(userMsProfileKey);

    if (savedMsToken && savedMsProfile) {
      console.log('✅ Found saved Microsoft credentials for this user');
      AppState.accessToken = savedMsToken;
      AppState.userProfile = JSON.parse(savedMsProfile);
      AppState.isAuthenticated = true;
      console.log('   → Microsoft account:', AppState.userProfile.email);
      console.log('   → Microsoft credentials restored');
    } else {
      console.log('ℹ️  No saved Microsoft credentials for this user');
    }

    // Check for Google credentials
    const userGoogleEmailKey = `google_email_${AppState.userId}`;
    const savedGoogleEmail = localStorage.getItem(userGoogleEmailKey);

    if (savedGoogleEmail) {
      console.log('✅ Found saved Google Drive connection for this user');
      AppState.googleDriveConnected = true;
      AppState.googleDriveEmail = savedGoogleEmail;
      console.log('   → Google account:', savedGoogleEmail);
      console.log('   → Google Drive credentials restored');
    } else {
      console.log('ℹ️  No saved Google Drive credentials for this user');
    }

    // Initialize app
    if (typeof initializeSubscribedChats === 'function') {
      await initializeSubscribedChats();
    }

    if (AppState.azureVmUrl && typeof AzureVMAPI !== 'undefined' && AzureVMAPI.startMessagePolling) {
      AzureVMAPI.startMessagePolling(30000);
    }

    // Restore the main app layout before rendering
    restoreAppLayout();
    renderApp();

  } catch (error) {
    console.error('Sign in error:', error);
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
    button.disabled = false;
    button.innerHTML = '<span>Sign In</span>';
  }
}

/**
 * Handle sign up form submission
 */
async function handleSignUp(event) {
  event.preventDefault();

  const button = document.getElementById('signup-button');
  const errorDiv = document.getElementById('signup-error');
  const form = event.target;

  const username = form.username.value.trim();
  const password = form.password.value;
  const passwordConfirm = form.password_confirm.value;

  if (!username || !password || !passwordConfirm) {
    errorDiv.textContent = 'Please fill in all fields';
    errorDiv.classList.remove('hidden');
    return;
  }

  if (password !== passwordConfirm) {
    errorDiv.textContent = 'Passwords do not match';
    errorDiv.classList.remove('hidden');
    return;
  }

  if (password.length < 6) {
    errorDiv.textContent = 'Password must be at least 6 characters';
    errorDiv.classList.remove('hidden');
    return;
  }

  // Show loading state
  button.disabled = true;
  button.innerHTML = '<span>Creating account...</span>';
  errorDiv.classList.add('hidden');

  try {
    console.log('📝 Attempting sign up for user:', username);

    const response = await fetch(`${AppState.authenticationUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    if (!response.ok) {
      let errorMessage = 'Sign up failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✓ Sign up successful:', data);

    // Show success message and redirect to sign in
    if (typeof showNotification === 'function') {
      showNotification('Account created successfully! Please sign in with your credentials.', 'success');
    }

    // Reset the form
    form.reset();

    // Switch to sign-in tab after a brief delay
    setTimeout(() => {
      showAuthTab('signin');
      // Pre-fill the username in the sign-in form
      document.getElementById('signin-username').value = username;
      button.disabled = false;
      button.innerHTML = '<span>Sign Up</span>';
    }, 1500);

  } catch (error) {
    console.error('Sign up error:', error);
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
    button.disabled = false;
    button.innerHTML = '<span>Sign Up</span>';
  }
}

/**
 * Handle logout - Clear user session and return to login screen
 */
function handleLogout() {
  // Clear user data from AppState
  AppState.userId = null;
  AppState.username = null;
  AppState.customAuthToken = null;

  // Also clear Microsoft and Google integrations (they are user-specific)
  AppState.isAuthenticated = false;
  AppState.accessToken = null;
  AppState.userProfile = null;
  AppState.googleDriveConnected = false;
  AppState.googleDriveEmail = '';

  // Clear other data
  AppState.documents = [];
  AppState.scheduledMessages = [];
  AppState.microsoftForms = [];
  AppState.subscribedChats = [];

  console.log('✓ User logged out');

  // Show success message
  if (typeof showNotification === 'function') {
    showNotification('Logged out successfully', 'success');
  }

  // Return to login screen
  setTimeout(() => {
    renderLoginScreen();
  }, 500);
}

// Export auth functions to global scope
if (typeof window !== 'undefined') {
  window.restoreAppLayout = restoreAppLayout;
  window.renderLoginScreen = renderLoginScreen;
  window.showAuthTab = showAuthTab;
  window.handleSignIn = handleSignIn;
  window.handleSignUp = handleSignUp;
  window.handleLogout = handleLogout;
}