import { ReactNode, useState } from 'react';
import {
  FolderOpen,
  Calendar,
  FileText,
  Share2,
  Menu,
  X,
  MessageSquare,
  LayoutDashboard,
  ClipboardList,
  Settings as SettingsIcon
} from 'lucide-react';

type View = 'dashboard' | 'documents' | 'scheduling' | 'forms' | 'responses' | 'sharepoint' | 'settings';

interface LayoutProps {
  children: ReactNode;
  currentView?: View;
  onViewChange?: (view: View) => void;
}

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-800'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

export default function Layout({ children, currentView = 'dashboard', onViewChange }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const viewTitles: Record<View, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Overview of your community management platform'
    },
    documents: {
      title: 'Document Management',
      subtitle: 'Manage your document collections and schedule messages'
    },
    scheduling: {
      title: 'Message Scheduling',
      subtitle: 'Schedule WhatsApp messages for delivery'
    },
    forms: {
      title: 'Forms Management',
      subtitle: 'Create and manage data collection forms'
    },
    responses: {
      title: 'Form Responses',
      subtitle: 'View and export form submissions'
    },
    sharepoint: {
      title: 'SharePoint Integration',
      subtitle: 'Connect to SharePoint to sync documents'
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage your application settings and integrations'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-gray-900 transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-blue-500" size={32} />
            <div>
              <h1 className="text-white font-bold text-lg">Community Curator</h1>
              <p className="text-gray-400 text-xs">SNM Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={currentView === 'dashboard'}
            onClick={() => onViewChange?.('dashboard')}
          />
          <NavItem
            icon={<FolderOpen size={20} />}
            label="Documents"
            active={currentView === 'documents'}
            onClick={() => onViewChange?.('documents')}
          />
          <NavItem
            icon={<Calendar size={20} />}
            label="Scheduling"
            active={currentView === 'scheduling'}
            onClick={() => onViewChange?.('scheduling')}
          />
          <NavItem
            icon={<FileText size={20} />}
            label="Forms"
            active={currentView === 'forms'}
            onClick={() => onViewChange?.('forms')}
          />
          <NavItem
            icon={<ClipboardList size={20} />}
            label="Responses"
            active={currentView === 'responses'}
            onClick={() => onViewChange?.('responses')}
          />
          <NavItem
            icon={<Share2 size={20} />}
            label="SharePoint"
            active={currentView === 'sharepoint'}
            onClick={() => onViewChange?.('sharepoint')}
          />
          <div className="pt-2 border-t border-gray-800 mt-2">
            <NavItem
              icon={<SettingsIcon size={20} />}
              label="Settings"
              active={currentView === 'settings'}
              onClick={() => onViewChange?.('settings')}
            />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="text-gray-400 text-xs">
            <p className="font-semibold">Open Source</p>
            <p>Built for UCL & Charities</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800">
              {viewTitles[currentView].title}
            </h2>
            <p className="text-sm text-gray-600">
              {viewTitles[currentView].subtitle}
            </p>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
