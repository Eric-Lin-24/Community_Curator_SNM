import { useState } from 'react';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { Form, FormSubmission } from '../types';

interface FormResponsesProps {
  forms: Form[];
  submissions: FormSubmission[];
}

export default function FormResponses({ forms, submissions }: FormResponsesProps) {
  const [selectedForm, setSelectedForm] = useState<string>('all');
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSubmissions = submissions.filter(s => {
    const matchesForm = selectedForm === 'all' || s.form_id === selectedForm;
    if (!matchesForm) return false;

    if (!searchQuery) return true;

    const form = forms.find(f => f.id === s.form_id);
    if (!form) return false;

    const searchLower = searchQuery.toLowerCase();
    return Object.values(s.data).some(value =>
      String(value).toLowerCase().includes(searchLower)
    );
  });

  const getFormById = (formId: string) => forms.find(f => f.id === formId);

  const exportToCSV = () => {
    if (filteredSubmissions.length === 0) return;

    const form = selectedForm !== 'all'
      ? forms.find(f => f.id === selectedForm)
      : null;

    if (!form && selectedForm !== 'all') return;

    const headers = form
      ? form.schema.map(field => field.label)
      : ['Form', 'Submitted At', 'Data'];

    const rows = filteredSubmissions.map(submission => {
      const submissionForm = getFormById(submission.form_id);
      if (!submissionForm) return [];

      if (form) {
        return form.schema.map(field => submission.data[field.id] || '');
      } else {
        return [
          submissionForm.name,
          new Date(submission.submitted_at).toLocaleString(),
          JSON.stringify(submission.data)
        ];
      }
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form-responses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Form Responses</h3>
            <p className="text-sm text-gray-600">View and manage form submissions</p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={filteredSubmissions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search responses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Forms</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.name} ({submissions.filter(s => s.form_id === form.id).length})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-auto h-full">
          {filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FileText size={48} className="mb-4 text-gray-400" />
              <p className="text-lg font-medium">No responses found</p>
              <p className="text-sm">
                {submissions.length === 0
                  ? 'Form submissions will appear here'
                  : 'Try adjusting your filters or search query'}
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {filteredSubmissions.length} {filteredSubmissions.length === 1 ? 'response' : 'responses'}
                </p>
              </div>

              <div className="space-y-3">
                {filteredSubmissions.map((submission) => {
                  const form = getFormById(submission.form_id);
                  if (!form) return null;

                  return (
                    <div
                      key={submission.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedSubmission(
                            expandedSubmission === submission.id ? null : submission.id
                          )
                        }
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText size={18} />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-800">{form.name}</p>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span>
                                {new Date(submission.submitted_at).toLocaleDateString()}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(submission.submitted_at).toLocaleTimeString()}
                              </span>
                              <span>•</span>
                              <span className="capitalize">{submission.source}</span>
                            </div>
                          </div>
                        </div>
                        {expandedSubmission === submission.id ? (
                          <ChevronUp size={20} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-400" />
                        )}
                      </button>

                      {expandedSubmission === submission.id && (
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {form.schema.map((field) => (
                              <div key={field.id}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {field.label}
                                  {field.required && <span className="text-red-600 ml-1">*</span>}
                                </label>
                                <div className="px-3 py-2 bg-white rounded-lg border border-gray-200">
                                  <p className="text-gray-800">
                                    {submission.data[field.id] !== undefined
                                      ? String(submission.data[field.id])
                                      : '-'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
