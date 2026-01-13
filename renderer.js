// Community Curator - Main Application Entry Point (Refactored)
// This file orchestrates the initialization and event listeners

// ============================================
// INITIALIZATION
// ============================================

// Listen for authentication events from main process
window.electronAPI.onAuthSuccess(() => {
  console.log('Authentication successful - checking status');
  MicrosoftGraphAPI.checkAuthentication();
});

window.electronAPI.onAuthError((error) => {
  console.error('Authentication error:', error);
  showNotification('Authentication failed: ' + error, 'error');
});

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

// ============================================
// APP STARTUP
// ============================================

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Community Curator starting...');

  // Initialize theme
  initializeTheme();

  // Check for saved custom auth
  const savedUserId = localStorage.getItem('userId');
  const savedUsername = localStorage.getItem('username');
  const savedAuthToken = localStorage.getItem('authToken');

  if (savedUserId && savedUsername && savedAuthToken) {
    AppState.userId = savedUserId;
    AppState.username = savedUsername;
    AppState.customAuthToken = savedAuthToken;
    console.log('✓ Restored user session:', savedUsername);
  }

  // If not authenticated with custom auth, show login screen
  if (!AppState.userId || !AppState.customAuthToken) {
    console.log('⚠️ User not authenticated - showing login screen');
    renderLoginScreen();
    return;
  }

  // Check Microsoft authentication status (optional)
  await MicrosoftGraphAPI.checkAuthentication();
  await GoogleDriveAPI.checkAuthentication();

  // Initialize subscribed chats from Azure VM
  await initializeSubscribedChats();

  // Start polling for message status updates (every 30 seconds)
  if (AppState.azureVmUrl) {
    AzureVMAPI.startMessagePolling(30000);
  }

  // Render the app
  renderApp();

  console.log('Community Curator initialized');
});

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

    const response = await fetch(`${AppState.azureVmUrl}/sign-in`, {
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

    // Save auth data
    AppState.userId = data.user_id;
    AppState.username = data.username;
    AppState.customAuthToken = data.token || data.access_token;

    localStorage.setItem('userId', data.user_id);
    localStorage.setItem('username', data.username);
    localStorage.setItem('authToken', data.token || data.access_token);

    console.log('✓ User session saved:', AppState.username);

    // Initialize app
    await initializeSubscribedChats();
    if (AppState.azureVmUrl) {
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
  button.innerHTML = '<span>Checking username...</span>';
  errorDiv.classList.add('hidden');

  try {
    // First, check if username is unique by querying /users endpoint
    console.log('🔍 Checking if username is available:', username);

    const usersResponse = await fetch(`${AppState.azureVmUrl}/users`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (usersResponse.ok) {
      const users = await usersResponse.json();

      // Check if username already exists
      const usernameExists = users.some(user =>
        user.username && user.username.toLowerCase() === username.toLowerCase()
      );

      if (usernameExists) {
        throw new Error('Username already taken. Please choose a different username.');
      }

      console.log('✓ Username is available');
    } else {
      console.warn('Could not verify username uniqueness, proceeding with registration');
    }

    // Proceed with registration
    button.innerHTML = '<span>Creating account...</span>';
    console.log('📝 Attempting sign up for user:', username);

    const response = await fetch(`${AppState.azureVmUrl}/register`, {
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

    // Save auth data
    AppState.userId = data.user_id;
    AppState.username = data.username;
    AppState.customAuthToken = data.token || data.access_token;

    localStorage.setItem('userId', data.user_id);
    localStorage.setItem('username', data.username);
    localStorage.setItem('authToken', data.token || data.access_token);

    console.log('✓ User account created and session saved:', AppState.username);

    // Initialize app
    await initializeSubscribedChats();
    if (AppState.azureVmUrl) {
      AzureVMAPI.startMessagePolling(30000);
    }
    renderApp();

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

  // Clear user-specific Microsoft and Google auth
  if (AppState.userId) {
    localStorage.removeItem(`ms_token_${AppState.userId}`);
    localStorage.removeItem(`ms_profile_${AppState.userId}`);
    localStorage.removeItem(`google_email_${AppState.userId}`);
    localStorage.removeItem(`google_token_${AppState.userId}`);
  }

  // Clear auth data
  AppState.userId = null;
  AppState.username = null;
  AppState.customAuthToken = null;
  AppState.isAuthenticated = false;
  AppState.accessToken = null;
  AppState.userProfile = null;
  AppState.googleDriveConnected = false;
  AppState.googleDriveEmail = '';

  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('authToken');

  // Stop polling
  if (AzureVMAPI && AzureVMAPI.stopMessagePolling) {
    AzureVMAPI.stopMessagePolling();
  }

  // Show login screen
  renderLoginScreen();
}
