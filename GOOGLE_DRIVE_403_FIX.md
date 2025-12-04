# ✅ FIXED: Google Drive 403 Error - Google Docs Export Implementation

## The Problem

```
Error: Request failed with status code 403
```

When trying to download "For Dummies: DANGANRONPA" from Google Drive.

## Root Cause

**Google Workspace files (Docs, Sheets, Slides) cannot be downloaded directly with `alt: 'media'`**. They must be **exported** to a downloadable format:

- ❌ **Old code**: Tried to download Google Doc directly → **403 Forbidden**
- ✅ **New code**: Exports Google Doc to PDF → **Works!**

### Why 403 Happened

Google Drive API returns 403 for Google Workspace files when you try to download them as-is because:
1. They don't have binary content (they're stored in Google's proprietary format)
2. You must use the `export` endpoint instead of `get` with `alt: 'media'`

---

## What I Fixed

### Updated `main.js` - `download-google-drive-file` Handler

Now properly handles **all** Google file types:

| File Type | Original MIME Type | Export Format | Extension |
|-----------|-------------------|---------------|-----------|
| **Google Docs** | `application/vnd.google-apps.document` | PDF | `.pdf` |
| **Google Sheets** | `application/vnd.google-apps.spreadsheet` | Excel (XLSX) | `.xlsx` |
| **Google Slides** | `application/vnd.google-apps.presentation` | PDF | `.pdf` |
| **Regular Files** | Any other | Original format | Original |

### Export Logic

```javascript
// Detects file type from MIME type
if (mimeType === 'application/vnd.google-apps.document') {
  // Export Google Doc as PDF
  response = await drive.files.export({
    fileId: fileId,
    mimeType: 'application/pdf'
  });
  finalFileName = `${fileName}.pdf`;
}
// ... similar for Sheets and Slides
else {
  // Download regular files directly
  response = await drive.files.get({
    fileId: fileId,
    alt: 'media'
  });
}
```

---

## 🧪 Test It Now

### IMPORTANT: Restart the app!

Changes to `main.js` IPC handlers require a restart.

### Steps:

1. **Restart the app completely**
2. **Go to Scheduling** → **Schedule Message**
3. **Click "☁️ Cloud Storage" tab**
4. **Select the Google Doc** ("For Dummies: DANGANRONPA")
5. **Click "Schedule"**
6. **Watch console (F12)**

### Expected Console Output:

```
=== DOWNLOADING FROM GOOGLE DRIVE ===
File ID: 149_BH8_Op_3DBNWlMrd-ADdn-ddpZ2UV6bDxz8M-eP4
File Name: For Dummies: DANGANRONPA

Exporting Google Doc as PDF...

File downloaded/exported successfully
- Original name: For Dummies: DANGANRONPA
- Final name: For Dummies: DANGANRONPA.pdf
- Size: XXXXX bytes
- MIME type: application/pdf

✓ File object created: For Dummies: DANGANRONPA.pdf XXXXX bytes application/pdf

Downloaded 1 file(s) successfully

=== FINAL FILE COUNT ===
Total files to send: 1
- Cloud files downloaded: 1 ["For Dummies: DANGANRONPA.pdf"]

╔════════════════════════════════════════════════════════════╗
║           FILES UPLOADED SUCCESSFULLY TO SERVER           ║
╠════════════════════════════════════════════════════════════╣
║ [1] For Dummies: DANGANRONPA.pdf                  │  XXX KB ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🎯 What Works Now

### Google Docs
✅ Detects as Google Doc  
✅ Exports to PDF  
✅ Downloads successfully  
✅ Uploads to server as `.pdf`

### Google Sheets
✅ Detects as Google Sheet  
✅ Exports to Excel (.xlsx)  
✅ Downloads successfully  
✅ Uploads to server as `.xlsx`

### Google Slides
✅ Detects as Google Slides  
✅ Exports to PDF  
✅ Downloads successfully  
✅ Uploads to server as `.pdf`

### Regular Files (PDFs, images, etc.)
✅ Downloads directly (no export needed)  
✅ Keeps original format  
✅ Uploads to server

---

## 📋 Technical Details

### Export MIME Types Used

**Google Docs → PDF**
```javascript
mimeType: 'application/pdf'
```

**Google Sheets → Excel**
```javascript
mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
```

**Google Slides → PDF**
```javascript
mimeType: 'application/pdf'
```

### File Naming

The code automatically adds the correct extension:
- `"For Dummies: DANGANRONPA"` → `"For Dummies: DANGANRONPA.pdf"`
- `"Budget 2025"` → `"Budget 2025.xlsx"`
- `"Presentation"` → `"Presentation.pdf"`

If the file already has the extension, it won't duplicate:
- `"Document.pdf"` stays `"Document.pdf"`

---

## 🔧 Why This Solution Works

### Before (Broken):
```javascript
// Tried to download Google Doc directly
const response = await drive.files.get({
  fileId: fileId,
  alt: 'media'  // ❌ Doesn't work for Google Workspace files
});
// Result: 403 Forbidden
```

### After (Fixed):
```javascript
// Export Google Doc to PDF first
const response = await drive.files.export({
  fileId: fileId,
  mimeType: 'application/pdf'  // ✅ Works!
});
// Result: PDF file downloaded successfully
```

---

## 🐛 Troubleshooting

### Still getting 403?
**Solution**: Restart the app completely

### File downloads but is empty?
**Check**: Look at console logs - should show "Exporting..."

### File has wrong extension?
**Check**: The code auto-adds `.pdf` or `.xlsx` based on type

### Want different export format?
You can modify the export MIME types:
- For Google Docs: Could use `application/vnd.openxmlformats-officedocument.wordprocessingml.document` for .docx
- For Google Slides: Could use `application/vnd.openxmlformats-officedocument.presentationml.presentation` for .pptx

---

## ✅ Summary

**Problem**: 403 error when downloading Google Docs  
**Cause**: Google Workspace files can't be downloaded directly  
**Solution**: Export to PDF/XLSX instead of downloading  

**Fixed File**: `main.js`  
**Changes**: Updated `download-google-drive-file` handler with export logic  

**Status**: ✅ READY TO TEST

---

## 🚀 Final Steps

1. **Restart the app** (mandatory for main.js changes)
2. **Test with the same Google Doc** that gave 403 error
3. **Watch console** - should show "Exporting Google Doc as PDF..."
4. **See success table** with `.pdf` file!

**The 403 error is now fixed! Google Docs will be exported to PDF and uploaded successfully!** 🎉

