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
 * Render the login/signup screen
 */
function renderLoginScreen() {
  const appContainer = document.querySelector('.app-container');
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

// Export auth functions to global scope
if (typeof window !== 'undefined') {
  window.renderLoginScreen = renderLoginScreen;
  window.showAuthTab = showAuthTab;
  window.handleSignIn = handleSignIn;
  window.handleSignUp = handleSignUp;
}