import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Share2,
  Bell,
  Globe,
  Shield,
  Database,
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { SharePointConnection } from '../types';

interface SettingsProps {
  connections: SharePointConnection[];
  onConnectionUpdate: (connections: SharePointConnection[]) => void;
}

export default function Settings({ connections, onConnectionUpdate }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'integrations' | 'notifications' | 'general'>('integrations');

  return (
    <div className="h-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gray-100 rounded-lg">
            <SettingsIcon size={24} className="text-gray-700" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Settings</h3>
            <p className="text-sm text-gray-600">Manage your application settings and integrations</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100%-120px)]">
        <div className="col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('integrations')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'integrations'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Share2 size={18} />
              <span className="font-medium">Integrations</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Bell size={18} />
              <span className="font-medium">Notifications</span>
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'general'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Globe size={18} />
              <span className="font-medium">General</span>
            </button>
          </nav>
        </div>

        <div className="col-span-9 bg-white rounded-xl shadow-sm border border-gray-200 overflow-auto">
          {activeTab === 'integrations' && (
            <IntegrationsTab
              connections={connections}
              onConnectionUpdate={onConnectionUpdate}
            />
          )}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'general' && <GeneralTab />}
        </div>
      </div>
    </div>
  );
}

interface IntegrationsTabProps {
  connections: SharePointConnection[];
  onConnectionUpdate: (connections: SharePointConnection[]) => void;
}

function IntegrationsTab({ connections, onConnectionUpdate }: IntegrationsTabProps) {
  const handleToggleSync = (connectionId: string) => {
    const updated = connections.map(conn =>
      conn.id === connectionId
        ? { ...conn, sync_enabled: !conn.sync_enabled }
        : conn
    );
    onConnectionUpdate(updated);
  };

  const integrations = [
    {
      name: 'WhatsApp Business API',
      icon: <Zap size={24} />,
      description: 'Send messages via WhatsApp Business API',
      status: 'configured',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      name: 'Telegram Bot API',
      icon: <Zap size={24} />,
      description: 'Send messages via Telegram Bot',
      status: 'not-configured',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-1">Messaging Platforms</h4>
        <p className="text-sm text-gray-600">Configure your messaging platform integrations</p>
      </div>

      <div className="space-y-4 mb-8">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${integration.bgColor}`}>
                <div className={integration.color}>{integration.icon}</div>
              </div>
              <div>
                <h5 className="font-semibold text-gray-800">{integration.name}</h5>
                <p className="text-sm text-gray-600">{integration.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {integration.status === 'configured' ? (
                <>
                  <CheckCircle size={20} className="text-green-600" />
                  <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    Configure
                  </button>
                </>
              ) : (
                <>
                  <XCircle size={20} className="text-gray-400" />
                  <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Setup
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-1">SharePoint Connections</h4>
        <p className="text-sm text-gray-600">Manage your SharePoint integration settings</p>
      </div>

      {connections.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <Share2 size={32} className="mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 mb-2">No SharePoint connections</p>
          <p className="text-sm text-gray-500">Go to SharePoint tab to add connections</p>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <Share2 size={20} />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800">{connection.name}</h5>
                  <p className="text-sm text-gray-600">{connection.site_url}</p>
                  {connection.last_sync && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last synced: {new Date(connection.last_sync).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={connection.sync_enabled}
                    onChange={() => handleToggleSync(connection.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Auto-sync</span>
                </label>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <RefreshCw size={18} className="text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h5 className="font-semibold text-blue-900 mb-1">Security Note</h5>
            <p className="text-sm text-blue-800">
              All integration credentials are encrypted and stored securely. Your data is never
              shared with third parties without your explicit consent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [messageFailures, setMessageFailures] = useState(true);
  const [formSubmissions, setFormSubmissions] = useState(false);
  const [syncComplete, setSyncComplete] = useState(true);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-1">Notification Preferences</h4>
        <p className="text-sm text-gray-600">Choose when and how you want to be notified</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h5 className="font-medium text-gray-800">Email Notifications</h5>
            <p className="text-sm text-gray-600">Receive notifications via email</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h5 className="font-medium text-gray-800">Message Failures</h5>
            <p className="text-sm text-gray-600">Get notified when messages fail to send</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={messageFailures}
              onChange={(e) => setMessageFailures(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h5 className="font-medium text-gray-800">Form Submissions</h5>
            <p className="text-sm text-gray-600">Get notified about new form responses</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formSubmissions}
              onChange={(e) => setFormSubmissions(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h5 className="font-medium text-gray-800">Sync Complete</h5>
            <p className="text-sm text-gray-600">Get notified when SharePoint sync completes</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={syncComplete}
              onChange={(e) => setSyncComplete(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}

function GeneralTab() {
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-1">General Settings</h4>
        <p className="text-sm text-gray-600">Configure your application preferences</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="UTC">UTC (Coordinated Universal Time)</option>
            <option value="EST">EST (Eastern Standard Time)</option>
            <option value="PST">PST (Pacific Standard Time)</option>
            <option value="GMT">GMT (Greenwich Mean Time)</option>
            <option value="CET">CET (Central European Time)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Format
          </label>
          <select
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h5 className="font-medium text-gray-800 mb-2">About</h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Version</span>
              <span className="font-medium text-gray-800">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">License</span>
              <span className="font-medium text-gray-800">Open Source</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Built for</span>
              <span className="font-medium text-gray-800">UCL & Charities</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
