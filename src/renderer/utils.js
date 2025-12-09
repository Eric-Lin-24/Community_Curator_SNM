// Utility functions

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString();
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString();
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
