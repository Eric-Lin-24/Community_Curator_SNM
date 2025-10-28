import { useState } from 'react';
import {
  FileText,
  Plus,
  X,
  Edit2,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Form, FormField, FormSubmission } from '../types';

export default function FormsManagement() {
  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [showNewFormModal, setShowNewFormModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [showSubmissions, setShowSubmissions] = useState(false);

  const getFormSubmissions = (formId: string) =>
    submissions.filter(s => s.form_id === formId);

  return (
    <div className="h-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Forms Management</h3>
            <p className="text-sm text-gray-600">Create and manage data collection forms</p>
          </div>
          <button
            onClick={() => setShowNewFormModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>New Form</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {forms.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center text-gray-500">
            <FileText size={48} className="mb-4 text-gray-400" />
            <p className="text-lg font-medium">No forms yet</p>
            <p className="text-sm">Create your first form to start collecting data</p>
          </div>
        ) : (
          forms.map((form) => {
            const formSubmissions = getFormSubmissions(form.id);
            return (
              <div
                key={form.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-lg mb-1">
                        {form.name}
                      </h4>
                      <p className="text-sm text-gray-600">{form.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedForm(form);
                          setShowSubmissions(true);
                        }}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                      >
                        <Eye size={18} />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit2 size={18} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => setForms(forms.filter(f => f.id !== form.id))}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{form.schema.length} fields</span>
                    <span>•</span>
                    <span>{formSubmissions.length} submissions</span>
                  </div>
                </div>

                <div className="p-6 bg-gray-50">
                  <h5 className="text-xs font-semibold text-gray-700 uppercase mb-3">
                    Form Fields
                  </h5>
                  <div className="space-y-2">
                    {form.schema.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded">
                            {field.type}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {field.label}
                          </span>
                        </div>
                        {field.required && (
                          <span className="text-xs text-red-600 font-medium">Required</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showNewFormModal && (
        <NewFormModal
          onClose={() => setShowNewFormModal(false)}
          onSave={(form) => {
            setForms([...forms, form]);
            setShowNewFormModal(false);
          }}
        />
      )}

      {showSubmissions && selectedForm && (
        <SubmissionsModal
          form={selectedForm}
          submissions={getFormSubmissions(selectedForm.id)}
          onClose={() => {
            setShowSubmissions(false);
            setSelectedForm(null);
          }}
        />
      )}
    </div>
  );
}

interface NewFormModalProps {
  onClose: () => void;
  onSave: (form: Form) => void;
}

function NewFormModal({ onClose, onSave }: NewFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [showFieldBuilder, setShowFieldBuilder] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fields.length === 0) {
      alert('Please add at least one field');
      return;
    }
    onSave({
      id: crypto.randomUUID(),
      name,
      description,
      schema: fields,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'temp-user'
    });
  };

  const addField = (field: Omit<FormField, 'id'>) => {
    setFields([...fields, { ...field, id: crypto.randomUUID() }]);
    setShowFieldBuilder(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Create New Form</h3>
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
              Form Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Contact Information"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              placeholder="Optional description..."
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Form Fields
              </label>
              <button
                type="button"
                onClick={() => setShowFieldBuilder(!showFieldBuilder)}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus size={16} />
                Add Field
              </button>
            </div>

            {showFieldBuilder && (
              <FieldBuilder
                onAdd={addField}
                onCancel={() => setShowFieldBuilder(false)}
              />
            )}

            <div className="space-y-2 mt-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-medium text-gray-500 uppercase bg-white px-2 py-1 rounded">
                      {field.type}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {field.label}
                    </span>
                    {field.required && (
                      <span className="text-xs text-red-600 font-medium">*</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFields(fields.filter(f => f.id !== field.id))}
                    className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
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
              Create Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FieldBuilderProps {
  onAdd: (field: Omit<FormField, 'id'>) => void;
  onCancel: () => void;
}

function FieldBuilder({ onAdd, onCancel }: FieldBuilderProps) {
  const [type, setType] = useState<FormField['type']>('text');
  const [label, setLabel] = useState('');
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState('');

  const handleAdd = () => {
    if (!label) return;
    onAdd({
      type,
      label,
      required,
      options: type === 'select' ? options.split('\n').filter(Boolean) : undefined
    });
    setLabel('');
    setRequired(false);
    setOptions('');
  };

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-3">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Field Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as FormField['type'])}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="text">Text</option>
            <option value="textarea">Text Area</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="select">Select</option>
            <option value="checkbox">Checkbox</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Field Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Full Name"
          />
        </div>
      </div>

      {type === 'select' && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Options (one per line)
          </label>
          <textarea
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
            placeholder="Option 1&#10;Option 2&#10;Option 3"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Required field
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Field
          </button>
        </div>
      </div>
    </div>
  );
}

interface SubmissionsModalProps {
  form: Form;
  submissions: FormSubmission[];
  onClose: () => void;
}

function SubmissionsModal({ form, submissions, onClose }: SubmissionsModalProps) {
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">{form.name} - Submissions</h3>
              <p className="text-sm text-gray-600">{submissions.length} total submissions</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {submissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No submissions yet</p>
              <p className="text-sm">Submissions will appear here once the form is filled out</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => (
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
                        <p className="font-medium text-gray-800">
                          {new Date(submission.submitted_at).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Source: {submission.source}</p>
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
                      <div className="space-y-3">
                        {form.schema.map((field) => (
                          <div key={field.id}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label}
                            </label>
                            <div className="px-3 py-2 bg-white rounded-lg border border-gray-200">
                              <p className="text-gray-800">
                                {submission.data[field.id] || '-'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
