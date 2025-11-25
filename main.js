const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { PublicClientApplication } = require('@azure/msal-node');
const http = require('http');

// Disable hardware acceleration to fix GPU errors on Windows
app.disableHardwareAcceleration();

let authServer = null;

// MSAL Configuration
const msalConfig = {
  auth: {
    clientId: 'd4769f4f-14be-444b-9934-f859662bc020',
    authority: 'https://login.microsoftonline.com/organizations'
  }
};

const pca = new PublicClientApplication(msalConfig);
const REDIRECT_URI = 'http://localhost:3000';
const SCOPES = [
  'User.Read',
  'Files.ReadWrite',
  'offline_access'
];

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
  try {
    const tokenRequest = {
      code: code,
      scopes: SCOPES,
      redirectUri: REDIRECT_URI
    };

    const response = await pca.acquireTokenByCode(tokenRequest);
    store.set('accessToken', response.accessToken);
    store.set('account', response.account);

    // Notify renderer process
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('auth-success');
      mainWindow.focus();
    }
  } catch (error) {
    console.error('Auth error:', error);
    BrowserWindow.getAllWindows()[0]?.webContents.send('auth-error', error.message);
  }
}

// Handle login request from renderer
ipcMain.handle('msal-login', async () => {
  try {
    // Start the local auth server if not already running
    if (!authServer) {
      authServer = await createAuthServer();
    }

    const authCodeUrlParams = {
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
      prompt: 'select_account'
    };

    const authCodeUrl = await pca.getAuthCodeUrl(authCodeUrlParams);

    // Open in the user's default browser instead of Electron window
    const { shell } = require('electron');
    await shell.openExternal(authCodeUrl);

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);

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
  const account = store.get('account');

  if (!account) {
    return null;
  }

  try {
    // Try silent token acquisition first
    const response = await pca.acquireTokenSilent({
      account: account,
      scopes: SCOPES
    });

    store.set('accessToken', response.accessToken);
    return response.accessToken;
  } catch (error) {
    console.log('Silent token acquisition failed:', error.message);
    // If silent fails, return null to trigger interactive login
    return null;
  }
});

// Logout
ipcMain.handle('msal-logout', async () => {
  store.delete('accessToken');
  store.delete('account');
  return true;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
