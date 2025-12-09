const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { PublicClientApplication, CachePersistence } = require('@azure/msal-node');
const SimpleStore = require('./simpleStore');
const http = require('http');
const { google } = require('googleapis');
const fs = require('fs');

// Disable hardware acceleration to fix GPU errors on Windows
app.disableHardwareAcceleration();

const store = new SimpleStore();
let authServer = null;
let googleAuthServer = null;
let googleTokens = null;


// MSAL Configuration with persistent cache
const msalConfig = {
  auth: {
    clientId: 'd4769f4f-14be-444b-9934-f859662bc020',
    authority: 'https://login.microsoftonline.com/organizations'
  },
  cache: {
    cachePlugin: {
      beforeCacheAccess: async (cacheContext) => {
        // Load cache from file
        const cacheLocation = path.join(app.getPath('userData'), 'msal-cache.json');
        if (fs.existsSync(cacheLocation)) {
          const cacheData = fs.readFileSync(cacheLocation, 'utf-8');
          cacheContext.tokenCache.deserialize(cacheData);
        }
      },
      afterCacheAccess: async (cacheContext) => {
        // Save cache to file
        if (cacheContext.cacheHasChanged) {
          const cacheLocation = path.join(app.getPath('userData'), 'msal-cache.json');
          fs.writeFileSync(cacheLocation, cacheContext.tokenCache.serialize());
        }
      }
    }
  }
};

const pca = new PublicClientApplication(msalConfig);
const REDIRECT_URI = 'http://localhost:3000';
const SCOPES = [
  'User.Read',
  'Files.ReadWrite',
  'offline_access'
];

// Google OAuth Configuration
// IMPORTANT: Replace these with your actual Google OAuth credentials
// Get them from: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = '811017499008-52eoerm7gjaio44pm94k7n71p37l2tv4.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const GOOGLE_REDIRECT_URI = 'http://localhost:3001';
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Load stored tokens on startup
async function loadStoredTokens() {
  try {
    console.log('Loading stored tokens...');

    // Check for Microsoft/OneDrive cached accounts
    try {
      const cache = pca.getTokenCache();
      const accounts = await cache.getAllAccounts();

      if (accounts && accounts.length > 0) {
        console.log('✓ Found cached Microsoft account:', accounts[0].username);
        console.log('✓ Microsoft tokens available in MSAL cache');
      } else {
        console.log('No cached Microsoft accounts found');
      }
    } catch (error) {
      console.log('No cached Microsoft accounts found');
    }

    // Load Google tokens
    const storedGoogleAccessToken = store.get('googleAccessToken');
    const storedGoogleRefreshToken = store.get('googleRefreshToken');
    const storedGoogleTokenExpiry = store.get('googleTokenExpiry');
    const googleUserInfo = store.get('googleUserInfo');

    if (storedGoogleAccessToken && storedGoogleRefreshToken) {
      // ✅ Restore oauth2Client credentials
      oauth2Client.setCredentials({
        access_token: storedGoogleAccessToken,
        refresh_token: storedGoogleRefreshToken,
        expiry_date: storedGoogleTokenExpiry
      });

      // ✅ Restore googleTokens variable (used by download handler)
      googleTokens = {
        access_token: storedGoogleAccessToken,
        refresh_token: storedGoogleRefreshToken,
        expires_at: storedGoogleTokenExpiry,
        scope: googleUserInfo?.scope,
        token_type: 'Bearer'
      };

      console.log('✓ Found stored Google account:', googleUserInfo?.email || 'Unknown');
      console.log('✓ Google tokens loaded successfully');
    } else {
      console.log('No stored Google tokens found');
    }

  } catch (error) {
    console.error('Error loading tokens:', error);
  }
}


// Create a local HTTP server to handle OAuth redirect
function createAuthServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:3000`);

      if (url.pathname === '/') {
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

        if (code) {
          // Success page
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Authentication Successful</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .container {
                  text-align: center;
                  background: white;
                  padding: 40px;
                  border-radius: 12px;
                  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }
                .success-icon {
                  width: 80px;
                  height: 80px;
                  margin: 0 auto 20px;
                  background: #10b981;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .checkmark {
                  color: white;
                  font-size: 50px;
                }
                h1 { color: #1f2937; margin: 0 0 10px 0; }
                p { color: #6b7280; margin: 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="success-icon">
                  <span class="checkmark">✓</span>
                </div>
                <h1>Authentication Successful!</h1>
                <p>You can close this window and return to the app.</p>
              </div>
              <script>
                setTimeout(() => window.close(), 2000);
              </script>
            </body>
            </html>
          `);

          // Handle the auth code
          handleAuthCode(code).then(() => {
            setTimeout(() => {
              server.close();
              authServer = null;
            }, 3000);
          });
        } else if (error) {
          // Error page
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Authentication Failed</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                }
                .container {
                  text-align: center;
                  background: white;
                  padding: 40px;
                  border-radius: 12px;
                  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                  max-width: 500px;
                }
                .error-icon {
                  width: 80px;
                  height: 80px;
                  margin: 0 auto 20px;
                  background: #ef4444;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .x-mark {
                  color: white;
                  font-size: 50px;
                  font-weight: bold;
                }
                h1 { color: #1f2937; margin: 0 0 10px 0; }
                p { color: #6b7280; margin: 0; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="error-icon">
                  <span class="x-mark">✕</span>
                </div>
                <h1>Authentication Failed</h1>
                <p>${errorDescription || error || 'Unknown error occurred'}</p>
              </div>
              <script>
                setTimeout(() => window.close(), 5000);
              </script>
            </body>
            </html>
          `);

          BrowserWindow.getAllWindows()[0]?.webContents.send('auth-error', errorDescription || error);

          setTimeout(() => {
            server.close();
            authServer = null;
          }, 6000);
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(3000, 'localhost', () => {
      console.log('Auth server listening on http://localhost:3000');
      resolve(server);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log('Port 3000 already in use, trying to close existing server...');
        // Port is already in use, might be from a previous run
        setTimeout(() => {
          server.listen(3000, 'localhost', () => {
            resolve(server);
          });
        }, 1000);
      } else {
        reject(err);
      }
    });
  });
}

// Create a local HTTP server to handle Google OAuth redirect
function createGoogleAuthServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:3001`);

      if (url.pathname === '/') {
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (code) {
          // Success page
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Google Drive Connected</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .container {
                  text-align: center;
                  background: white;
                  padding: 40px;
                  border-radius: 12px;
                  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }
                .success-icon {
                  width: 80px;
                  height: 80px;
                  margin: 0 auto 20px;
                  background: #10b981;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .checkmark {
                  color: white;
                  font-size: 50px;
                }
                h1 { color: #1f2937; margin: 0 0 10px 0; }
                p { color: #6b7280; margin: 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="success-icon">
                  <span class="checkmark">✓</span>
                </div>
                <h1>Google Drive Connected!</h1>
                <p>You can close this window and return to the app.</p>
              </div>
              <script>
                setTimeout(() => window.close(), 2000);
              </script>
            </body>
            </html>
          `);

          // Handle the auth code
          handleGoogleAuthCode(code).then(() => {
            setTimeout(() => {
              server.close();
              googleAuthServer = null;
            }, 3000);
          });
        } else if (error) {
          // Error page
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Authentication Failed</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                }
                .container {
                  text-align: center;
                  background: white;
                  padding: 40px;
                  border-radius: 12px;
                  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                  max-width: 500px;
                }
                .error-icon {
                  width: 80px;
                  height: 80px;
                  margin: 0 auto 20px;
                  background: #ef4444;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .x-mark {
                  color: white;
                  font-size: 50px;
                  font-weight: bold;
                }
                h1 { color: #1f2937; margin: 0 0 10px 0; }
                p { color: #6b7280; margin: 0; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="error-icon">
                  <span class="x-mark">✕</span>
                </div>
                <h1>Authentication Failed</h1>
                <p>${error || 'Unknown error occurred'}</p>
              </div>
              <script>
                setTimeout(() => window.close(), 5000);
              </script>
            </body>
            </html>
          `);

          BrowserWindow.getAllWindows()[0]?.webContents.send('google-auth-error', error);

          setTimeout(() => {
            server.close();
            googleAuthServer = null;
          }, 6000);
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(3001, 'localhost', () => {
      console.log('Google Auth server listening on http://localhost:3001');
      resolve(server);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log('Port 3001 already in use, trying to close existing server...');
        setTimeout(() => {
          server.listen(3001, 'localhost', () => {
            resolve(server);
          });
        }, 1000);
      } else {
        reject(err);
      }
    });
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in development
  mainWindow.webContents.openDevTools();

  return mainWindow;
}

// ...existing code...

async function handleAuthCode(code) {
  console.log('\n🔐 [Microsoft Auth] Processing authorization code...');

  try {
    const tokenRequest = {
      code: code,
      scopes: SCOPES,
      redirectUri: REDIRECT_URI
    };

    console.log('   → Exchanging auth code for tokens...');
    const response = await pca.acquireTokenByCode(tokenRequest);

    console.log('   ✓ Token exchange successful');
    console.log('   ✓ Account:', response.account.username);
    console.log('   ✓ Home Account ID:', response.account.homeAccountId);
    console.log('   ✓ Tokens cached via MSAL');
    console.log('   ✓ Cache persisted to: msal-cache.json\n');

    // Notify renderer process
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('auth-success');
      mainWindow.focus();
    }
  } catch (error) {
    console.error('\n❌ [Microsoft Auth] Failed:', error.message);
    console.error('   Error details:', error);
    BrowserWindow.getAllWindows()[0]?.webContents.send('auth-error', error.message);
  }
}

// Handle login request from renderer
ipcMain.handle('msal-login', async () => {
  console.log('\n🔓 [Microsoft Auth] Starting login flow...');

  try {
    // Start the local auth server if not already running
    if (!authServer) {
      console.log('   → Starting local auth server on port 3000...');
      authServer = await createAuthServer();
    } else {
      console.log('   → Auth server already running');
    }

    const authCodeUrlParams = {
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
      prompt: 'select_account'
    };

    console.log('   → Generating authorization URL...');
    const authCodeUrl = await pca.getAuthCodeUrl(authCodeUrlParams);

    console.log('   → Opening browser for user authentication...');
    console.log('   → Scopes requested:', SCOPES.join(', '));

    // Open in the user's default browser instead of Electron window
    const { shell } = require('electron');
    await shell.openExternal(authCodeUrl);

    console.log('   ✓ Browser opened - waiting for user to complete sign-in...\n');
    return { success: true };
  } catch (error) {
    console.error('\n❌ [Microsoft Auth] Login failed:', error.message);

    // Clean up server on error
    if (authServer) {
      authServer.close();
      authServer = null;
    }

    throw error;
  }
});

// Get stored access token (with silent refresh if expired)
ipcMain.handle('get-access-token', async () => {
  console.log('\n🔍 [Microsoft Auth] Checking for cached tokens...');

  try {
    // ✅ Query MSAL's cache for accounts instead of SimpleStore
    const cache = pca.getTokenCache();
    const accounts = await cache.getAllAccounts();

    if (!accounts || accounts.length === 0) {
      console.log('   ℹ No cached Microsoft accounts found\n');
      return null;
    }

    // Use the first account (or you could pick based on username/homeAccountId)
    const account = accounts[0];
    console.log('   ✓ Found cached account:', account.username);
    console.log('   → Attempting silent token acquisition...');

    // Try silent token acquisition with the cached account
    const response = await pca.acquireTokenSilent({
      account: account,
      scopes: SCOPES
    });

    console.log('   ✓ Silent token acquisition successful');
    console.log('   ✓ Access token retrieved (valid for ~1 hour)\n');
    return response.accessToken;
  } catch (error) {
    console.error('   ✗ Silent token acquisition failed:', error.message);
    console.log('   ℹ User will need to sign in again\n');
    // If silent fails, return null to trigger interactive login
    return null;
  }
});

// Logout
ipcMain.handle('msal-logout', async () => {
  console.log('\n🚪 [Microsoft Auth] Logging out...');

  try {
    // ✅ Remove account from MSAL's cache
    const cache = pca.getTokenCache();
    const accounts = await cache.getAllAccounts();

    if (accounts && accounts.length > 0) {
      console.log(`   → Removing ${accounts.length} account(s) from cache...`);
      // Remove all accounts from cache
      for (const account of accounts) {
        console.log('   → Removing:', account.username);
        await cache.removeAccount(account);
      }
      console.log('   ✓ Microsoft accounts removed from cache');
    } else {
      console.log('   ℹ No accounts to remove');
    }

    // Clean up old SimpleStore entries (for backward compatibility)
    store.delete('accessToken');
    store.delete('account');

    console.log('   ✓ Logout complete\n');
    return true;
  } catch (error) {
    console.error('   ❌ Logout error:', error.message);
    return false;
  }
});

// ============================================
// GOOGLE OAUTH HANDLERS
// ============================================

async function handleGoogleAuthCode(code) {
  console.log('\n🔐 [Google Auth] Processing authorization code...');

  try {
    console.log('   → Exchanging auth code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('   ✓ Token exchange successful');

    // ✅ Store tokens in googleTokens variable
    googleTokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiry_date,
      scope: tokens.scope,
      token_type: tokens.token_type
    };

    // Store tokens in persistent storage
    store.set('googleAccessToken', tokens.access_token);
    store.set('googleRefreshToken', tokens.refresh_token);
    store.set('googleTokenExpiry', tokens.expiry_date);

    console.log('   → Fetching user profile...');
    // Get user profile
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    store.set('googleUserInfo', {
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture
    });

    console.log('   ✓ Account:', userInfo.data.email);
    console.log('   ✓ Name:', userInfo.data.name);
    console.log('   ✓ Tokens cached in SimpleStore');
    console.log('   ✓ Cache persisted to: community-curator-store.json\n');

    // Notify renderer process
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('google-auth-success', {
        email: userInfo.data.email,
        name: userInfo.data.name
      });
      mainWindow.focus();
    }
  } catch (error) {
    console.error('\n❌ [Google Auth] Failed:', error.message);
    console.error('   Error details:', error);
    BrowserWindow.getAllWindows()[0]?.webContents.send('google-auth-error', error.message);
  }
}


// Handle Google login request from renderer
ipcMain.handle('google-login', async () => {
  console.log('\n🔓 [Google Auth] Starting login flow...');

  try {
    // Start the local auth server if not already running
    if (!googleAuthServer) {
      console.log('   → Starting local auth server on port 3001...');
      googleAuthServer = await createGoogleAuthServer();
    } else {
      console.log('   → Auth server already running');
    }

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_SCOPES,
      prompt: 'consent'
    });

    console.log('   → Opening browser for user authentication...');
    console.log('   → Scopes requested:', GOOGLE_SCOPES.join(', '));

    // Open in the user's default browser
    const { shell } = require('electron');
    await shell.openExternal(authUrl);

    console.log('   ✓ Browser opened - waiting for user to complete sign-in...\n');
    return { success: true };
  } catch (error) {
    console.error('\n❌ [Google Auth] Login failed:', error.message);

    // Clean up server on error
    if (googleAuthServer) {
      googleAuthServer.close();
      googleAuthServer = null;
    }

    throw error;
  }
});



// Get stored Google access token (with refresh if expired)
ipcMain.handle('get-google-access-token', async () => {
  const accessToken = store.get('googleAccessToken');
  const refreshToken = store.get('googleRefreshToken');
  const expiry = store.get('googleTokenExpiry');

  if (!accessToken || !refreshToken) {
    return null;
  }

  // Check if token is expired
  if (expiry && Date.now() >= expiry) {
    console.log('\n🔄 [Google Auth] Access token expired, refreshing...');
    try {
      // Refresh the token
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update stored tokens
      store.set('googleAccessToken', credentials.access_token);
      store.set('googleTokenExpiry', credentials.expiry_date);

      console.log('   ✓ Token refresh successful\n');
      return credentials.access_token;
    } catch (error) {
      console.error('   ✗ Token refresh failed:', error.message);
      console.log('   ℹ User will need to sign in again\n');
      return null;
    }
  }

  return accessToken;
});

// Get Google user info
ipcMain.handle('get-google-user-info', async () => {
  return store.get('googleUserInfo') || null;
});

// Get Google Drive files
ipcMain.handle('get-google-drive-files', async () => {
  try {
    // Get access token directly from storage
    let accessToken = store.get('googleAccessToken');
    const refreshToken = store.get('googleRefreshToken');
    const expiry = store.get('googleTokenExpiry');

    if (!accessToken || !refreshToken) {
      return [];
    }

    // Check if token is expired and refresh if needed
    if (expiry && Date.now() >= expiry) {
      try {
        oauth2Client.setCredentials({
          refresh_token: refreshToken
        });

        const { credentials } = await oauth2Client.refreshAccessToken();

        // Update stored tokens
        store.set('googleAccessToken', credentials.access_token);
        store.set('googleTokenExpiry', credentials.expiry_date);

        accessToken = credentials.access_token;
      } catch (error) {
        console.log('Token refresh failed:', error.message);
        return [];
      }
    }

    // Set credentials and fetch files
    oauth2Client.setCredentials({
      access_token: accessToken
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const response = await drive.files.list({
      pageSize: 100,
      fields: 'files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink, iconLink)',
      orderBy: 'modifiedTime desc'
    });

    return response.data.files || [];
  } catch (error) {
    console.error('Error fetching Google Drive files:', error);
    throw error;
  }
});

// Download Google Drive file
ipcMain.handle('download-google-drive-file', async (event, { fileId, fileName, mimeType }) => {
  if (!googleTokens || !googleTokens.access_token) {
    throw new Error('No Google access token available');
  }

  const googleWorkspaceTypes = {
    'application/vnd.google-apps.document': { mimeType: 'application/pdf', extension: '.pdf' },
    'application/vnd.google-apps.spreadsheet': { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: '.xlsx' },
    'application/vnd.google-apps.presentation': { mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', extension: '.pptx' },
    'application/vnd.google-apps.drawing': { mimeType: 'application/pdf', extension: '.pdf' }
  };

  const isGoogleWorkspace = googleWorkspaceTypes[mimeType];
  let url, exportMimeType, exportFileName;

  if (isGoogleWorkspace) {
    exportMimeType = isGoogleWorkspace.mimeType;
    const baseFileName = fileName.replace(/\.[^/.]+$/, '');
    exportFileName = baseFileName + isGoogleWorkspace.extension;
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
  } else {
    exportMimeType = mimeType;
    exportFileName = fileName;
    url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${googleTokens.access_token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  return {
    buffer: Array.from(new Uint8Array(buffer)),
    fileName: exportFileName,
    mimeType: exportMimeType
  };
});


// Logout from Google
ipcMain.handle('google-logout', async () => {
  console.log('\n🚪 [Google Auth] Logging out...');

  const userInfo = store.get('googleUserInfo');
  if (userInfo?.email) {
    console.log('   → Removing account:', userInfo.email);
  }

  store.delete('googleAccessToken');
  store.delete('googleRefreshToken');
  store.delete('googleTokenExpiry');
  store.delete('googleUserInfo');
  oauth2Client.setCredentials({});

  console.log('   ✓ Google tokens removed from cache');
  console.log('   ✓ Logout complete\n');
  return true;
});

app.whenReady().then(() => {
  createWindow();
    loadStoredTokens();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
