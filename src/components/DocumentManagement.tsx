import { useState } from 'react';
import {
  FolderPlus,
  FilePlus,
  Search,
  MoreVertical,
  Folder,
  File,
  Trash2,
  Edit2
} from 'lucide-react';
import { DocumentCollection, Document } from '../types';

export default function DocumentManagement() {
  const [collections, setCollections] = useState<DocumentCollection[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [showNewDocumentModal, setShowNewDocumentModal] = useState(false);

  const filteredCollections = collections.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDocuments = documents.filter(d =>
    (!selectedCollection || d.collection_id === selectedCollection) &&
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      <div className="col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Collections</h3>
            <button
              onClick={() => setShowNewCollectionModal(true)}
              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
            >
              <FolderPlus size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          <button
            onClick={() => setSelectedCollection(null)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1 ${
              selectedCollection === null
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Folder size={18} />
            <span className="font-medium">All Documents</span>
            <span className="ml-auto text-sm text-gray-500">{documents.length}</span>
          </button>

          {filteredCollections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => setSelectedCollection(collection.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1 ${
                selectedCollection === collection.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Folder size={18} />
              <div className="flex-1 text-left">
                <p className="font-medium">{collection.name}</p>
                {collection.description && (
                  <p className="text-xs text-gray-500 truncate">{collection.description}</p>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {documents.filter(d => d.collection_id === collection.id).length}
              </span>
            </button>
          ))}

          {filteredCollections.length === 0 && searchQuery && (
            <div className="text-center py-8 text-gray-500">
              <p>No collections found</p>
            </div>
          )}
        </div>
      </div>

      <div className="col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">
              {selectedCollection
                ? collections.find(c => c.id === selectedCollection)?.name
                : 'All Documents'}
            </h3>
            <p className="text-sm text-gray-600">{filteredDocuments.length} documents</p>
          </div>
          <button
            onClick={() => setShowNewDocumentModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FilePlus size={18} />
            <span>New Document</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <File size={48} className="mb-4 text-gray-400" />
              <p className="text-lg font-medium">No documents yet</p>
              <p className="text-sm">Create your first document to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <File size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 mb-1">{doc.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{doc.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">
                        Source: {doc.source}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Edit2 size={16} className="text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNewCollectionModal && (
        <NewCollectionModal
          onClose={() => setShowNewCollectionModal(false)}
          onSave={(collection) => {
            setCollections([...collections, collection]);
            setShowNewCollectionModal(false);
          }}
        />
      )}

      {showNewDocumentModal && (
        <NewDocumentModal
          collections={collections}
          selectedCollection={selectedCollection}
          onClose={() => setShowNewDocumentModal(false)}
          onSave={(document) => {
            setDocuments([...documents, document]);
            setShowNewDocumentModal(false);
          }}
        />
      )}
    </div>
  );
}

interface NewCollectionModalProps {
  onClose: () => void;
  onSave: (collection: DocumentCollection) => void;
}

function NewCollectionModal({ onClose, onSave }: NewCollectionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: crypto.randomUUID(),
      name,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'temp-user'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-xl font-semibold mb-4">New Collection</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collection Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Marketing Materials"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              placeholder="Optional description..."
            />
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
              Create Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface NewDocumentModalProps {
  collections: DocumentCollection[];
  selectedCollection: string | null;
  onClose: () => void;
  onSave: (document: Document) => void;
}

function NewDocumentModal({
  collections,
  selectedCollection,
  onClose,
  onSave
}: NewDocumentModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [collectionId, setCollectionId] = useState(selectedCollection || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: crypto.randomUUID(),
      collection_id: collectionId || null,
      title,
      content,
      file_url: null,
      source: 'local',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'temp-user'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
        <h3 className="text-xl font-semibold mb-4">New Document</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Welcome Message Template"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collection
            </label>
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Collection</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-48 resize-none font-mono text-sm"
              placeholder="Enter document content..."
              required
            />
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
              Create Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
