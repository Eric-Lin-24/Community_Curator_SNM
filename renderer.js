// Community Curator - Main Application Entry Point (Refactored)
// This file orchestrates the initialization and event listeners

// ============================================
// INITIALIZATION
// ============================================

// Listen for authentication events from main process
window.electronAPI.onAuthSuccess(() => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   [RENDERER] AUTH-SUCCESS EVENT RECEIVED!                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('🎉 Main process sent "auth-success" event');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('📞 Calling MicrosoftGraphAPI.checkAuthentication()...');
  console.log('   (This will fetch the token from main process and save it)\n');

  MicrosoftGraphAPI.checkAuthentication();

  // If user is on settings page, refresh it to show updated connection status
  if (AppState.currentView === 'settings') {
    renderSettings();
  }
});

window.electronAPI.onAuthError((error) => {
  console.error('\n╔════════════════════════════════════════════════════════════╗');
  console.error('║   [RENDERER] AUTH-ERROR EVENT RECEIVED!                    ║');
  console.error('╚════════════════════════════════════════════════════════════╝');
  console.error('❌ Error from main process:', error);
  console.error('⏰ Timestamp:', new Date().toISOString());
  showNotification('Authentication failed: ' + error, 'error');
});

window.electronAPI.onGoogleAuthSuccess((data) => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   [RENDERER] GOOGLE AUTH-SUCCESS EVENT RECEIVED!           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('🎉 Google authentication successful');
  console.log('   Email:', data.email);
  console.log('   Name:', data.name);

  AppState.googleDriveConnected = true;
  AppState.googleDriveEmail = data.email;

  // Save Google email to user-specific localStorage
  if (AppState.userId) {
    const userGoogleEmailKey = `google_email_${AppState.userId}`;
    localStorage.setItem(userGoogleEmailKey, data.email);
    console.log('✅ Saved Google email to localStorage for user:', AppState.userId);
  }

  showNotification(`Connected to Google Drive: ${data.email}`, 'success');

  // If user is on settings page, refresh it to show updated connection status
  if (AppState.currentView === 'settings') {
    renderSettings();
  } else {
    renderApp();
  }
});

window.electronAPI.onGoogleAuthError((error) => {
  console.error('\n╔════════════════════════════════════════════════════════════╗');
  console.error('║   [RENDERER] GOOGLE AUTH-ERROR EVENT RECEIVED!             ║');
  console.error('╚════════════════════════════════════════════════════════════╝');
  console.error('❌ Google authentication error:', error);
  showNotification('Google authentication failed: ' + error, 'error');
});

// ============================================
// APP STARTUP
// ============================================

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Community Curator starting...');

  // Initialize theme
  initializeTheme();

  // Always show login screen on startup - no persistent sessions
  console.log('⚠️ Please sign in to continue');
  renderLoginScreen();
});

/**
 * Restore the main app structure (sidebar and header)
 */
function restoreAppStructure() {
  const appContainer = document.querySelector('.app-container');
  appContainer.innerHTML = `
    <!-- Sidebar -->
    <aside id="sidebar" class="sidebar">
      <div class="sidebar-header">
        <div class="logo-container">
          <svg class="logo-icon" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v7.72c0 4.7-3.07 9.09-7.5 10.5-.28-.08-.56-.17-.83-.27C7.67 24.15 4 19.77 4 14.5V7.78l8-3.6z"/>
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
          </svg>
          <div>
            <h1 class="logo-title">Community Curator</h1>
            <p class="logo-subtitle">SNM Platform</p>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button class="nav-item active" data-view="dashboard" onclick="navigateTo('dashboard')">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Dashboard</span>
        </button>

        <button class="nav-item" data-view="documents" onclick="navigateTo('documents')">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span>Documents</span>
        </button>

        <button class="nav-item" data-view="scheduling" onclick="navigateTo('scheduling')">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Scheduling</span>
        </button>

        <button class="nav-item" data-view="forms" onclick="navigateTo('forms')">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Forms</span>
        </button>

        <div class="nav-divider"></div>

        <button class="nav-item" data-view="settings" onclick="navigateTo('settings')">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <p class="footer-title">Open Source</p>
        <p class="footer-subtitle">Built for UCL & Charities</p>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main-container">
      <header class="header">
        <button class="menu-button" onclick="toggleSidebar()">
          <svg class="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div class="header-content">
          <h2 id="view-title" class="header-title">Dashboard</h2>
          <p id="view-subtitle" class="header-subtitle">Overview of your community management platform</p>
        </div>
        <button class="help-button" onclick="showHelpGuide()" title="Help & Quick Start Guide">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </header>

      <main id="content" class="content">
        <!-- Content will be dynamically rendered here -->
      </main>
    </div>
  `;
}

/**
 * Render the login/signup screen
 */
function renderLoginScreen() {
  const appContainer = document.querySelector('.app-container');
  appContainer.innerHTML = `
    <div class="login-screen">
      <div class="login-container">
        <div class="login-header">
          <div class="logo-container">
            <svg class="logo-icon" fill="currentColor" viewBox="0 0 24 24" style="width: 64px; height: 64px;">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v7.72c0 4.7-3.07 9.09-7.5 10.5-.28-.08-.56-.17-.83-.27C7.67 24.15 4 19.77 4 14.5V7.78l8-3.6z"/>
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

  if (tab === 'signin') {
    tabs[0].classList.add('active');
    document.getElementById('signin-form').classList.add('active');
  } else {
    tabs[1].classList.add('active');
    document.getElementById('signup-form').classList.add('active');
  }

  // Clear error messages
  document.getElementById('signin-error').classList.add('hidden');
  document.getElementById('signup-error').classList.add('hidden');
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
    AppState.userId = data.uuid || data.user_id; // Support both field names for compatibility
    AppState.username = data.username;

    console.log('✓ User logged in:', AppState.username);
    console.log('✓ User ID set to:', AppState.userId);

    // Restore the main app structure (sidebar and header) before rendering
    restoreAppStructure();

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
    showNotification(`Account created successfully! Please sign in with your credentials.`, 'success');

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
 * Handle logout
 */
function handleLogout() {
  console.log('🚪 Logging out user:', AppState.username);

  // Clear user-specific Microsoft and Google auth from localStorage
  if (AppState.userId) {
    localStorage.removeItem(`ms_token_${AppState.userId}`);
    localStorage.removeItem(`ms_profile_${AppState.userId}`);
    localStorage.removeItem(`google_email_${AppState.userId}`);
    localStorage.removeItem(`google_token_${AppState.userId}`);
  }

  // Clear all auth data from memory
  AppState.userId = null;
  AppState.username = null;
  AppState.isAuthenticated = false;
  AppState.accessToken = null;
  AppState.userProfile = null;
  AppState.googleDriveConnected = false;
  AppState.googleDriveEmail = '';

  // Stop polling
  if (AzureVMAPI && AzureVMAPI.stopMessagePolling) {
    AzureVMAPI.stopMessagePolling();
  }

  // Show login screen
  renderLoginScreen();
}
