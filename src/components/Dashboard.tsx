import {
  FileText,
  MessageSquare,
  Calendar,
  CheckCircle,
  TrendingUp,
  Clock,
  File
} from 'lucide-react';
import { Document, ScheduledMessage, FormSubmission } from '../types';

interface DashboardProps {
  documents: Document[];
  scheduledMessages: ScheduledMessage[];
  formSubmissions: FormSubmission[];
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
  color: string;
  bgColor: string;
}

function StatCard({ icon, title, value, subtitle, color, bgColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mb-1">{value.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <div className={color}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({
  documents,
  scheduledMessages,
  formSubmissions
}: DashboardProps) {
  const upcomingMessages = scheduledMessages
    .filter(m => m.status === 'pending' && new Date(m.scheduled_time) > new Date())
    .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
    .slice(0, 5);

  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const activeConversations = scheduledMessages.filter(m => m.status === 'sent').length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Overview</h3>
        <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<FileText size={24} />}
          title="Total Documents"
          value={documents.length}
          subtitle="All documents"
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<MessageSquare size={24} />}
          title="Active Conversations"
          value={activeConversations}
          subtitle="Messages sent"
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<Calendar size={24} />}
          title="Scheduled Messages"
          value={scheduledMessages.filter(m => m.status === 'pending').length}
          subtitle="Pending delivery"
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatCard
          icon={<CheckCircle size={24} />}
          title="Form Responses"
          value={formSubmissions.length}
          subtitle="Total submissions"
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="text-orange-600" size={20} />
                <h4 className="font-semibold text-gray-800">Upcoming Scheduled Messages</h4>
              </div>
              <span className="text-sm text-gray-500">{upcomingMessages.length} pending</span>
            </div>
          </div>
          <div className="p-6">
            {upcomingMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No upcoming messages</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingMessages.map((message) => (
                  <div
                    key={message.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                      <MessageSquare size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm mb-1">
                        To: {message.recipient}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {message.message_content}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{new Date(message.scheduled_time).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{new Date(message.scheduled_time).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span className="capitalize">{message.platform}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <File className="text-blue-600" size={20} />
                <h4 className="font-semibold text-gray-800">Recent Documents</h4>
              </div>
              <span className="text-sm text-gray-500">{documents.length} total</span>
            </div>
          </div>
          <div className="p-6">
            {recentDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No documents yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <File size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm mb-1">{doc.title}</p>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{doc.content}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="capitalize">{doc.source}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-xl font-semibold mb-2">Getting Started</h4>
            <p className="text-blue-100 mb-4">
              Start managing your community communications effectively
            </p>
            <ul className="space-y-2 text-sm text-blue-50">
              <li className="flex items-center gap-2">
                <CheckCircle size={16} />
                <span>Create document collections to organize content</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} />
                <span>Schedule WhatsApp messages for your community</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} />
                <span>Build forms to collect data from members</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} />
                <span>Connect to SharePoint for document syncing</span>
              </li>
            </ul>
          </div>
          <div className="p-4 bg-white bg-opacity-20 rounded-lg">
            <TrendingUp size={48} />
          </div>
        </div>
      </div>
    </div>
  );
}
