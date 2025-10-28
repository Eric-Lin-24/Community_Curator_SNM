import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DocumentManagement from './components/DocumentManagement';
import MessageScheduling from './components/MessageScheduling';
import FormsManagement from './components/FormsManagement';
import FormResponses from './components/FormResponses';
import SharePointIntegration from './components/SharePointIntegration';
import Settings from './components/Settings';
import { Document, ScheduledMessage, FormSubmission, Form, SharePointConnection } from './types';

type View = 'dashboard' | 'documents' | 'scheduling' | 'forms' | 'responses' | 'sharepoint' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const [documents, setDocuments] = useState<Document[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([]);
  const [connections, setConnections] = useState<SharePointConnection[]>([]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            documents={documents}
            scheduledMessages={scheduledMessages}
            formSubmissions={formSubmissions}
          />
        );
      case 'documents':
        return <DocumentManagement />;
      case 'scheduling':
        return <MessageScheduling />;
      case 'forms':
        return <FormsManagement />;
      case 'responses':
        return (
          <FormResponses
            forms={forms}
            submissions={formSubmissions}
          />
        );
      case 'sharepoint':
        return <SharePointIntegration />;
      case 'settings':
        return (
          <Settings
            connections={connections}
            onConnectionUpdate={setConnections}
          />
        );
      default:
        return (
          <Dashboard
            documents={documents}
            scheduledMessages={scheduledMessages}
            formSubmissions={formSubmissions}
          />
        );
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

export default App;
