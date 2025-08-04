import React, { useState, useEffect } from 'react';
import { Plus, FileText, Edit3, Trash2, Save, X, Download, Upload } from 'lucide-react';
import { apiClient, DesignDocument, CreateDesignDocRequest } from '../utils/apiClient';
import { useAppStore } from '../store/useAppStore';

interface DocFormData {
  name: string;
  doc_type: string;
  content: string;
}

const DesignDocsView: React.FC = () => {
  const [docs, setDocs] = useState<DesignDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DesignDocument | null>(null);
  const [formData, setFormData] = useState<DocFormData>({
    name: '',
    doc_type: 'HLD',
    content: ''
  });

  const { currentProject } = useAppStore();

  useEffect(() => {
    loadDesignDocs();
  }, [currentProject]);

  const loadDesignDocs = async () => {
    // For demo purposes, we'll use a mock project if none is set
    const projectId = currentProject?.id || 'mock-project-1';

    try {
      setLoading(true);
      const docsData = await apiClient.getDesignDocs(projectId);
      setDocs(docsData);
    } catch (err) {
      setError('Failed to load design documents');
      console.error('Error loading design docs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoc = async () => {
    const projectId = currentProject?.id || 'mock-project-1';

    try {
      const newDoc = await apiClient.createDesignDoc(projectId, formData);
      setDocs([...docs, newDoc]);
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      setError('Failed to create design document');
      console.error('Error creating doc:', err);
    }
  };

  const handleUpdateDoc = async () => {
    const projectId = currentProject?.id || 'mock-project-1';
    if (!editingDoc) return;

    try {
      const updatedDoc = await apiClient.updateDesignDoc(
        projectId,
        editingDoc.id,
        formData
      );
      setDocs(docs.map(doc => doc.id === editingDoc.id ? updatedDoc : doc));
      setEditingDoc(null);
      resetForm();
    } catch (err) {
      setError('Failed to update design document');
      console.error('Error updating doc:', err);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    const projectId = currentProject?.id || 'mock-project-1';
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await apiClient.deleteDesignDoc(projectId, docId);
      setDocs(docs.filter(doc => doc.id !== docId));
    } catch (err) {
      setError('Failed to delete design document');
      console.error('Error deleting doc:', err);
    }
  };

  const startEdit = (doc: DesignDocument) => {
    setEditingDoc(doc);
    setFormData({
      name: doc.name,
      doc_type: doc.doc_type,
      content: doc.content
    });
    setShowCreateForm(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      doc_type: 'HLD',
      content: ''
    });
  };

  const cancelEdit = () => {
    setEditingDoc(null);
    setShowCreateForm(false);
    resetForm();
  };

  const exportDoc = (doc: DesignDocument) => {
    const blob = new Blob([doc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDocTypeColor = (type: string) => {
    switch (type) {
      case 'HLD': return 'bg-blue-100 text-blue-800';
      case 'LLD': return 'bg-green-100 text-green-800';
      case 'Architecture': return 'bg-purple-100 text-purple-800';
      case 'Requirements': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="fluent-page-container">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fluent-page-container">
      <div className="fluent-page-header">
        <div>
          <h1 className="fluent-page-title">Design Documents</h1>
          <p className="fluent-page-subtitle">
            Manage architecture and design documents for {currentProject?.name || 'your project'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="fluent-button fluent-button-primary fluent-button-with-icon"
        >
          <Plus className="w-4 h-4" />
          New Document
        </button>
      </div>

      {error && (
        <div className="fluent-alert fluent-alert-error mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingDoc) && (
        <div className="lcm-card mb-6">
          <h2 className="fluent-card-title mb-4">
            {editingDoc ? 'Edit Document' : 'Create New Document'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="fluent-form-group">
              <label className="fluent-label">
                Document Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="fluent-input"
                placeholder="e.g., System Architecture Document"
              />
            </div>
            <div className="fluent-form-group">
              <label className="fluent-label">
                Document Type
              </label>
              <select
                value={formData.doc_type}
                onChange={(e) => setFormData({ ...formData, doc_type: e.target.value })}
                className="fluent-select"
              >
                <option value="HLD">High Level Design (HLD)</option>
                <option value="LLD">Low Level Design (LLD)</option>
                <option value="Architecture">Architecture</option>
                <option value="Requirements">Requirements</option>
                <option value="Technical Specification">Technical Specification</option>
                <option value="API Documentation">API Documentation</option>
              </select>
            </div>
          </div>
          <div className="fluent-form-group mb-4">
            <label className="fluent-label">
              Content (Markdown)
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={15}
              className="fluent-input font-mono"
              placeholder="Write your document content in Markdown format..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={editingDoc ? handleUpdateDoc : handleCreateDoc}
              className="fluent-button fluent-button-primary fluent-button-with-icon"
            >
              <Save className="w-4 h-4" />
              {editingDoc ? 'Update' : 'Create'}
            </button>
            <button
              onClick={cancelEdit}
              className="fluent-button fluent-button-subtle fluent-button-with-icon"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {docs.map((doc) => (
          <div key={doc.id} className="lcm-card lcm-card-interactive">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-purple-600" />
                <h3 className="fluent-card-title truncate">{doc.name}</h3>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDocTypeColor(doc.doc_type)}`}>
                {doc.doc_type}
              </span>
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              <p className="line-clamp-3">
                {doc.content ? 
                  doc.content.substring(0, 150) + (doc.content.length > 150 ? '...' : '') :
                  'No content available'
                }
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                {doc.content.length} characters
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(doc)}
                  className="fluent-button fluent-button-subtle fluent-button-icon"
                  title="Edit document"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => exportDoc(doc)}
                  className="fluent-button fluent-button-subtle fluent-button-icon"
                  title="Export document"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteDoc(doc.id)}
                  className="fluent-button fluent-button-subtle fluent-button-icon"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {docs.length === 0 && !loading && (
          <div className="fluent-empty-state">
            <div className="fluent-empty-state-icon">
              <FileText className="w-16 h-16" />
            </div>
            <h3 className="fluent-empty-state-title">No design documents yet</h3>
            <p className="fluent-empty-state-description">
              Create your first design document to start documenting your system architecture.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="fluent-button fluent-button-primary fluent-button-with-icon mt-4"
            >
              <Plus className="w-4 h-4" />
              Create First Document
            </button>
          </div>
        )}
    </div>
  );
};

export default DesignDocsView;
