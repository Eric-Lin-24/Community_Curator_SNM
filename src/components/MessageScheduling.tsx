import { useState } from 'react';
import {
  Calendar,
  Clock,
  MessageSquare,
  Send,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  FileText,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
import { ScheduledMessage, Document, MessageTemplate } from '../types';

export default function MessageScheduling() {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'messages' | 'templates'>('messages');

  const filteredMessages = messages.filter(
    m => filterStatus === 'all' || m.status === filterStatus
  );

  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    sent: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    failed: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    cancelled: { icon: X, color: 'text-gray-600', bg: 'bg-gray-50' }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Message Scheduling</h3>
            <p className="text-sm text-gray-600">Schedule WhatsApp messages for delivery</p>
          </div>
          <button
            onClick={() => activeTab === 'messages' ? setShowNewMessageModal(true) : setShowNewTemplateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {activeTab === 'messages' ? <Send size={18} /> : <Plus size={18} />}
            <span>{activeTab === 'messages' ? 'Schedule Message' : 'New Template'}</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'messages'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'templates'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Templates
            </button>
          </div>

          {activeTab === 'messages' && (
            <div className="flex gap-2">
              {['all', 'pending', 'sent', 'failed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-lg transition-colors capitalize text-sm ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                  <span className="ml-1 text-xs">
                    ({status === 'all'
                      ? messages.length
                      : messages.filter(m => m.status === status).length})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-auto h-full">
          {activeTab === 'messages' ? (
            filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageSquare size={48} className="mb-4 text-gray-400" />
                <p className="text-lg font-medium">No scheduled messages</p>
                <p className="text-sm">Create your first scheduled message to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
              {filteredMessages.map((message) => {
                const StatusIcon = statusConfig[message.status].icon;
                return (
                  <div key={message.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${statusConfig[message.status].bg}`}>
                        <StatusIcon size={24} className={statusConfig[message.status].color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-1">
                              To: {message.recipient}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <MessageSquare size={14} />
                                {message.platform}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {new Date(message.scheduled_time).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {new Date(message.scheduled_time).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                            statusConfig[message.status].bg
                          } ${statusConfig[message.status].color}`}>
                            {message.status}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                          {message.message_content}
                        </p>
                        {message.error_message && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">
                              <strong>Error:</strong> {message.error_message}
                            </p>
                          </div>
                        )}
                        {message.sent_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            Sent at: {new Date(message.sent_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {message.status === 'pending' && (
                        <button
                          onClick={() => {
                            setMessages(messages.map(m =>
                              m.id === message.id ? { ...m, status: 'cancelled' } : m
                            ));
                          }}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            )
          ) : (
            templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FileText size={48} className="mb-4 text-gray-400" />
                <p className="text-lg font-medium">No message templates</p>
                <p className="text-sm">Create reusable templates to speed up message scheduling</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-800">{template.name}</h5>
                          <span className="text-xs text-gray-500 capitalize">{template.platform}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <Edit2 size={14} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => setTemplates(templates.filter(t => t.id !== template.id))}
                          className="p-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={14} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                      {template.content}
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setActiveTab('messages');
                          setShowNewMessageModal(true);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {showNewMessageModal && (
        <NewMessageModal
          templates={templates}
          onClose={() => setShowNewMessageModal(false)}
          onSave={(message) => {
            setMessages([...messages, message]);
            setShowNewMessageModal(false);
          }}
        />
      )}

      {showNewTemplateModal && (
        <NewTemplateModal
          onClose={() => setShowNewTemplateModal(false)}
          onSave={(template) => {
            setTemplates([...templates, template]);
            setShowNewTemplateModal(false);
          }}
        />
      )}
    </div>
  );
}

interface NewMessageModalProps {
  templates: MessageTemplate[];
  onClose: () => void;
  onSave: (message: ScheduledMessage) => void;
}

function NewMessageModal({ templates, onClose, onSave }: NewMessageModalProps) {
  const [platform, setPlatform] = useState<'whatsapp' | 'telegram'>('whatsapp');
  const [recipient, setRecipient] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);

    onSave({
      id: crypto.randomUUID(),
      document_id: null,
      platform,
      recipient,
      scheduled_time: scheduledDateTime.toISOString(),
      status: 'pending',
      message_content: messageContent,
      sent_at: null,
      error_message: null,
      created_at: new Date().toISOString(),
      user_id: 'temp-user'
    });
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Schedule New Message</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {templates.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Use Template (Optional)
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value);
                  const template = templates.find(t => t.id === e.target.value);
                  if (template) {
                    setMessageContent(template.content);
                    if (template.platform !== 'all') {
                      setPlatform(template.platform);
                    }
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.platform})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPlatform('whatsapp')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  platform === 'whatsapp'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="inline mr-2" size={18} />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setPlatform('telegram')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  platform === 'telegram'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <Send className="inline mr-2" size={18} />
                Telegram
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Phone number or ID"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={minDate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Time
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Content
            </label>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-48 resize-none"
              placeholder="Enter your message..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {messageContent.length} characters
            </p>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Send size={18} />
              Schedule Message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface NewTemplateModalProps {
  onClose: () => void;
  onSave: (template: MessageTemplate) => void;
}

function NewTemplateModal({ onClose, onSave }: NewTemplateModalProps) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState<'whatsapp' | 'telegram' | 'all'>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: crypto.randomUUID(),
      name,
      content,
      platform,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'temp-user'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Create Message Template</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Weekly Update"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as 'whatsapp' | 'telegram' | 'all')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Platforms</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-48 resize-none"
              placeholder="Enter template message..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {content.length} characters
            </p>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Create Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
