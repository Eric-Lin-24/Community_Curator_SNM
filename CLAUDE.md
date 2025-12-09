# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Community Curator is an Electron desktop application for managing community communications, documents, forms, and messaging. It integrates with Microsoft Graph (OneDrive/Forms), Google Drive, and custom Azure VM APIs for WhatsApp/Telegram chat management.

## Development Commands

```bash
# Install dependencies
npm install

# Run application in development mode
npm start
# or
npm run dev

# Package for distribution (requires Electron Forge setup)
npx electron-forge import  # First-time setup
npm run package            # Create package
npm run make              # Create distributable
```

## Architecture Overview

### Electron Structure

This is a **single-page application (SPA)** with vanilla JavaScript (no React/Vue/Angular):

- **main.js** (906 lines): Electron main process, OAuth servers, IPC handlers, token management
- **renderer.js** (3,892 lines): All application logic, UI rendering, API integrations
- **preload.js** (22 lines): Secure IPC bridge between main and renderer processes
- **index.html**: HTML structure with minimal markup (dynamic rendering)
- **styles.css** (1,646 lines): Complete styling with CSS variables, animations, dark mode
- **simpleStore.js** (118 lines): Key-value JSON file storage for persistence

### State Management

The application uses a centralized **AppState** object (in-memory) defined in renderer.js:

```javascript
AppState = {
  currentView: 'dashboard',
  documents: [],
  scheduledMessages: [],
  microsoftForms: [],
  formSubmissions: [],
  selectedForm: null,
  isAuthenticated: false,
  accessToken: null,
  userProfile: null,
  googleDriveConnected: false,
  googleDriveEmail: '',
  activeDocumentSource: 'onedrive',
  subscribedChats: [],
  azureVmUrl: 'http://...'
}
```

**Important**: All data is volatile except for authentication tokens. AppState resets on application restart.

### IPC Communication Pattern

**Context isolation is enabled** for security. All communication between renderer and main process happens via IPC:

1. Define handler in **main.js**: `ipcMain.handle('handler-name', async (event, args) => {...})`
2. Expose in **preload.js**: `window.electronAPI.methodName: () => ipcRenderer.invoke('handler-name')`
3. Call from **renderer.js**: `await window.electronAPI.methodName()`

Events use a similar pattern with `ipcRenderer.on()` in preload and `webContents.send()` in main.

## Authentication & APIs

### Microsoft Authentication (MSAL)

- Uses `@azure/msal-node` with persistent token cache
- OAuth redirect on `http://localhost:3000`
- Client ID: `d4769f4f-14be-444b-9934-f859662bc020`
- Scopes: `User.Read`, `Files.ReadWrite`, `offline_access`
- Tokens cached in `msal-cache.json` in userData directory
- Access tokens auto-refresh using cached refresh tokens

**Key functions** (main.js):
- `createAuthServer()`: Starts OAuth redirect server on port 3000
- IPC handlers: `msal-login`, `get-access-token`, `msal-logout`

### Google Drive Authentication

- Uses `googleapis` OAuth2 client
- OAuth redirect on `http://localhost:3001`
- Client ID: `811017499008-52eoerm7gjaio44pm94k7n71p37l2tv4`
- **Warning**: Client secret is hardcoded (security risk for production)
- Tokens stored via SimpleStore in `community-curator-store.json`
- Supports Google Workspace document export (Docs→PDF, Sheets→XLSX)

**Key functions** (main.js):
- `createGoogleAuthServer()`: Starts OAuth redirect server on port 3001
- IPC handlers: `google-login`, `get-google-access-token`, `get-google-drive-files`, `download-google-drive-file`

### API Modules (renderer.js)

- **MicrosoftGraphAPI**: User profile, OneDrive operations, Forms (mock data)
- **GoogleDriveAPI**: Drive file listing, downloads, token refresh
- **AzureVMAPI**: Fetch subscribed chats from custom endpoint

All API calls use Bearer token authentication with proper Authorization headers.

## View Rendering System

Views are dynamically rendered by functions in renderer.js:

- `renderDashboard()`: Statistics, recent activity, quick actions
- `renderDocuments()`: File browser with OneDrive/Google Drive toggle
- `renderScheduling()`: Message scheduling interface, Azure VM chat integration
- `renderForms()`: Forms list and management (uses mock data)
- `renderSettings()`: Integration configuration, theme toggle

Navigation: `navigateTo(viewName)` updates `AppState.currentView` and triggers appropriate render function.

## Key Implementation Details

### Message Scheduling

Messages are stored in `AppState.scheduledMessages` array with structure:
```javascript
{
  id: 'msg_...',
  recipient: 'phone or chat ID',
  message: 'content',
  platform: 'whatsapp'|'telegram',
  scheduledTime: Date,
  status: 'pending'|'sent'|'failed'|'cancelled',
  attachments: []
}
```

**Azure VM Integration**:
- Configure URL in Settings → saves to AppState
- Fetches from `/api/subscribed-chats` endpoint
- Expected response: `{chats: [{id, name, platform, type}]}`
- Requires CORS enabled on server

### Document Management

- Supports two sources: OneDrive (Microsoft Graph) and Google Drive
- Toggle between sources: `activeDocumentSource` in AppState
- OneDrive: Uses Microsoft Graph `/me/drive/root/children` endpoint
- Google Drive: Uses Drive API v3 with file export for Google Workspace docs
- Downloads handled via IPC (`download-google-drive-file` for Google, direct fetch for OneDrive)

### Forms System

**Current implementation uses mock data** instead of real Microsoft Forms API. To integrate real Forms API:
1. Update `MicrosoftGraphAPI.getForms()` to call Microsoft Forms Graph endpoints
2. Implement proper form creation/deletion
3. Connect form responses to real submission data

### Styling & Theming

- **CSS Variables** for theming (see `:root` and `.dark-mode` in styles.css)
- **Light mode** (default): Neutral backgrounds, dark text, cyan/pink accents
- **Dark mode**: Dark backgrounds (#0f1219), light text, brighter neon accents
- Theme saved to localStorage, loaded on startup
- Gradient borders and neon effects throughout UI
- Animations: fadeIn, pulse, glow, float, spin

**Key utility classes**: `.card`, `.btn`, `.form-control`, `.badge`, `.gradient-border`

## Security Considerations

1. **Context isolation enabled**: Renderer cannot directly access Node.js APIs
2. **No nodeIntegration**: Must use IPC for all system operations
3. **Token storage**: Tokens stored in OS-protected userData directory
4. **OAuth flow**: Authorization code exchange, no tokens in URLs
5. **CORS requirements**: External APIs must allow Electron's origin

**Known issue**: Google OAuth client secret is hardcoded in main.js. For production, use environment variables or secure configuration.

## Data Persistence

**Current state**: Only authentication tokens persist between sessions.

**To add persistence for application data**:
1. Use SimpleStore (already available) for key-value storage
2. Save AppState to SimpleStore on critical updates
3. Load from SimpleStore on app initialization
4. Example: `store.set('scheduledMessages', AppState.scheduledMessages)`

## Testing Azure VM Integration

To test chat subscription integration:

1. Ensure your Azure VM exposes endpoint: `GET /api/subscribed-chats`
2. Enable CORS for Electron app origin
3. Expected response format:
   ```json
   {
     "chats": [
       {"id": "123", "name": "Community Chat", "platform": "whatsapp", "type": "group"}
     ]
   }
   ```
4. Configure URL in Settings page
5. Verify connection status indicator turns green
6. Subscribed chats appear in Scheduling page recipient dropdown

## Common Development Tasks

**Add a new view**:
1. Create `renderNewView()` function in renderer.js
2. Add navigation button in sidebar (HTML in `renderApp()`)
3. Add case in `navigateTo()` switch statement
4. Implement event handlers for view-specific actions

**Add a new IPC handler**:
1. Register in main.js: `ipcMain.handle('new-handler', async (event, arg) => {...})`
2. Expose in preload.js: `newMethod: (arg) => ipcRenderer.invoke('new-handler', arg)`
3. Call from renderer.js: `await window.electronAPI.newMethod(arg)`

**Add a new API integration**:
1. Create API module object in renderer.js (e.g., `NewServiceAPI = {...}`)
2. Implement authentication method
3. Add data fetching methods
4. Integrate with appropriate view rendering functions

**Modify styling**:
- Theme colors: Update CSS variables in `:root` and `.dark-mode`
- Component styles: Find/add utility classes in styles.css
- Animations: Modify `@keyframes` definitions
- Layout: Update grid/flexbox properties in component classes

## File Locations

- **User data directory**: `~/Library/Application Support/Community Curator` (macOS), `%APPDATA%/Community Curator` (Windows)
- **MSAL token cache**: `<userData>/msal-cache.json`
- **SimpleStore data**: `<userData>/community-curator-store.json`
- **Theme preference**: Browser localStorage (key: `theme`)

## Important Notes

- DevTools open by default in development (see `createWindow()` in main.js)
- Hardware acceleration disabled for compatibility
- Window dimensions: 1400x900 (default)
- OAuth servers run on localhost ports 3000 (Microsoft) and 3001 (Google)
- Multi-tenant Microsoft auth supports any organization account
- Form submissions are currently mock data for demonstration
