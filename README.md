# Community Curator - WhatsApp Document Management

A desktop application built with Electron for managing community communications, documents, and forms.

## Features

- **Dashboard**: Overview of all activities
- **Document Management**: Organize documents in collections
- **Message Scheduling**: Schedule WhatsApp/Telegram messages
- **Forms Management**: Create custom data collection forms
- **Form Responses**: View and export form submissions
- **SharePoint Integration**: Connect to SharePoint for document syncing
- **Settings**: Configure integrations and preferences

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Run the Application

```bash
npm start
```

## Using with Electron Fiddle

1. Open Electron Fiddle
2. Click "File" > "Open Fiddle"
3. Navigate to this project folder
4. Click "Run" to start the application

## Using with Electron Forge

### Initial Setup

```bash
npm install --save-dev @electron-forge/cli
npx electron-forge import
```

### Package the Application

```bash
npm run package
```

### Create Distributable

```bash
npm run make
```

## Project Structure

```
project/
├── main.js           # Electron main process
├── renderer.js       # Application logic and UI rendering
├── index.html        # Main HTML structure
├── styles.css        # Application styles
├── package.json      # Node.js dependencies and scripts
└── README.md         # This file
```

## Features Details

### Dashboard
- View statistics for documents, messages, and forms
- See upcoming scheduled messages
- Quick access to recent documents
- Getting started guide

### Document Management
- Create document collections
- Organize documents by category
- Search and filter documents

### Message Scheduling
- Schedule WhatsApp messages
- Schedule Telegram messages
- View message status (pending, sent, failed, cancelled)
- Filter messages by status

### Forms Management
- Create custom forms with multiple field types
- Text, textarea, number, date, select, checkbox fields
- Mark fields as required
- View form submissions

### Form Responses
- View all form submissions
- Filter responses by form
- Export responses to CSV
- Search through responses

### SharePoint Integration
- Connect to SharePoint sites
- Configure folder paths for syncing
- Enable/disable automatic sync
- Manual sync trigger

## Development

The application uses vanilla JavaScript (no build process required) and is fully compatible with Electron Fiddle and Electron Forge.

### Technology Stack
- **Electron**: Desktop application framework
- **Vanilla JavaScript**: No React, no TypeScript compilation needed
- **CSS**: Custom styling (Tailwind-inspired utility classes)
- **Local Storage**: Data persistence (can be extended)

## Data Storage

Currently, all data is stored in memory and will be lost when the application closes. To add persistence:

1. Use `localStorage` for simple data storage
2. Use `electron-store` for more robust storage
3. Integrate with a backend API or database

## Future Enhancements

- [ ] Data persistence with localStorage or electron-store
- [ ] WhatsApp Business API integration
- [ ] Telegram Bot API integration
- [ ] SharePoint OAuth authentication
- [ ] Export documents to PDF
- [ ] Backup and restore functionality
- [ ] Multi-language support
- [ ] Dark mode

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

Built for UCL & Charities as an open-source community management platform.

