import { useState } from 'react';
import {
  Share2,
  Plus,
  RefreshCw,
  Link as LinkIcon,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  FolderOpen
} from 'lucide-react';
import { SharePointConnection } from '../types';

export default function SharePointIntegration() {
  const [connections, setConnections] = useState<SharePointConnection[]>([]);
  const [showNewConnectionModal, setShowNewConnectionModal] = useState(false);

  const handleSync = (connectionId: string) => {
    setConnections(connections.map(conn =>
      conn.id === connectionId
        ? { ...conn, last_sync: new Date().toISOString() }
        : conn
    ));
  };

  return (
    <div className="h-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">SharePoint Integration</h3>
            <p className="text-sm text-gray-600">
              Connect to SharePoint to sync documents and data
            </p>
          </div>
          <button
            onClick={() => setShowNewConnectionModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>New Connection</span>
          </button>
        </div>
      </div>

      {connections.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center text-gray-500">
          <Share2 size={48} className="mb-4 text-gray-400" />
          <p className="text-lg font-medium">No SharePoint connections</p>
          <p className="text-sm mb-6">Connect to SharePoint to start syncing documents</p>
          <button
            onClick={() => setShowNewConnectionModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>Add Your First Connection</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                      <Share2 size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 text-lg mb-1">
                        {connection.name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm">
                        <LinkIcon size={14} className="text-gray-400" />
                        <a
                          href={connection.site_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate max-w-xs"
                        >
                          {connection.site_url}
                        </a>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setConnections(connections.filter(c => c.id !== connection.id))
                    }
                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {connection.sync_enabled ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <XCircle size={16} className="text-gray-400" />
                    )}
                    <span className="text-sm text-gray-600">
                      Sync {connection.sync_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {connection.last_sync && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={14} />
                      <span>
                        Last sync: {new Date(connection.last_sync).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-gray-50">
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Folder Path
                  </label>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FolderOpen size={14} />
                    <code className="bg-white px-2 py-1 rounded border border-gray-200">
                      {connection.folder_path || '/'}
                    </code>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSync(connection.id)}
                    disabled={!connection.sync_enabled}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={16} />
                    <span>Sync Now</span>
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                    <Settings size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewConnectionModal && (
        <NewConnectionModal
          onClose={() => setShowNewConnectionModal(false)}
          onSave={(connection) => {
            setConnections([...connections, connection]);
            setShowNewConnectionModal(false);
          }}
        />
      )}
    </div>
  );
}

interface NewConnectionModalProps {
  onClose: () => void;
  onSave: (connection: SharePointConnection) => void;
}

function NewConnectionModal({ onClose, onSave }: NewConnectionModalProps) {
  const [name, setName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: crypto.randomUUID(),
      name,
      site_url: siteUrl,
      folder_path: folderPath,
      sync_enabled: syncEnabled,
      last_sync: null,
      created_at: new Date().toISOString(),
      user_id: 'temp-user'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
        <h3 className="text-xl font-semibold mb-4">New SharePoint Connection</h3>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This is a placeholder interface. In production, you'll need to configure OAuth authentication and Microsoft Graph API credentials to connect to SharePoint.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connection Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., UCL Documents"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SharePoint Site URL
            </label>
            <input
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://yourcompany.sharepoint.com/sites/yoursite"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Folder Path
            </label>
            <input
              type="text"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., /Shared Documents/Community"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to sync from root folder
            </p>
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={syncEnabled}
                onChange={(e) => setSyncEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable automatic sync</span>
            </label>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Connection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
