import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, MessageSquare, ExternalLink } from 'lucide-react';
import { PurpleGlassButton, PurpleGlassCard, PurpleGlassTextarea } from '../components/ui';
import { apiClient, ApprovalWithContext, ApprovalStatus } from '../utils/apiClient';

const ApprovalInbox: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalWithContext | null>(null);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      const response = await apiClient.getPendingApprovals();
      setApprovals(response.approvals);
    } catch (error) {
      console.error('Failed to load approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string, approvalComments?: string) => {
    setProcessing(true);
    try {
      await apiClient.approveApproval(approvalId, {
        comments: approvalComments,
      });
      await loadApprovals();
      setSelectedApproval(null);
      setComments('');
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (approvalId: string, approvalComments?: string) => {
    setProcessing(true);
    try {
      await apiClient.rejectApproval(approvalId, {
        comments: approvalComments,
      });
      await loadApprovals();
      setSelectedApproval(null);
      setComments('');
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getApproverTypeColor = (type: string) => {
    switch (type) {
      case 'USER':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ROLE':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'GROUP':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="lcm-page-container">
        <PurpleGlassCard>
          <div className="text-center py-12">
            <Clock className="animate-spin mx-auto mb-4" size={48} />
            <p className="text-gray-600">Loading approvals...</p>
          </div>
        </PurpleGlassCard>
      </div>
    );
  }

  return (
    <div className="lcm-page-container">
      <PurpleGlassCard>
        <div className="lcm-page-header">
          <div>
            <h1 className="lcm-page-title">Approval Inbox</h1>
            <p className="lcm-page-subtitle">
              Review and respond to pending workflow approvals
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg border border-purple-300">
              <span className="font-semibold">{approvals.length}</span> pending
            </div>
          </div>
        </div>

        {/* Approvals List */}
        <div className="space-y-4">
          {approvals.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
              <p className="text-gray-600">No pending approvals</p>
              <p className="text-sm text-gray-500 mt-2">You're all caught up!</p>
            </div>
          ) : (
            approvals.map((item) => (
              <div
                key={item.approval.id}
                className="p-6 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all duration-200 bg-white/80"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="text-yellow-600" size={20} />
                      <h3 className="font-semibold text-gray-900 text-lg">{item.workflow_name}</h3>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getApproverTypeColor(
                          item.approval.approver_type
                        )}`}
                      >
                        {item.approval.approver_type}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Triggered by:</span>
                        <span className="capitalize">{item.trigger_record_type}</span>
                        <ExternalLink size={14} className="text-gray-400" />
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {item.trigger_record_id}
                        </code>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Requested:</span>
                        <span>{new Date(item.approval.requested_at).toLocaleString()}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">
                          {Math.floor(
                            (Date.now() - new Date(item.approval.requested_at).getTime()) /
                              1000 /
                              60
                          )}{' '}
                          minutes ago
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <PurpleGlassButton
                      variant="secondary"
                      size="small"
                      onClick={() => setSelectedApproval(item)}
                      icon={<MessageSquare size={16} />}
                      glass
                    >
                      Review
                    </PurpleGlassButton>
                    <PurpleGlassButton
                      variant="primary"
                      size="small"
                      onClick={() => handleApprove(item.approval.id!)}
                      icon={<CheckCircle size={16} />}
                      glass
                      disabled={processing}
                    >
                      Quick Approve
                    </PurpleGlassButton>
                    <PurpleGlassButton
                      variant="danger"
                      size="small"
                      onClick={() => handleReject(item.approval.id!)}
                      icon={<XCircle size={16} />}
                      glass
                      disabled={processing}
                    >
                      Quick Reject
                    </PurpleGlassButton>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Approval Details Modal */}
        {selectedApproval && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Review Approval</h2>
                <button
                  onClick={() => {
                    setSelectedApproval(null);
                    setComments('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workflow
                  </label>
                  <p className="text-gray-900">{selectedApproval.workflow_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Triggered By
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="capitalize text-gray-900">
                      {selectedApproval.trigger_record_type}
                    </span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {selectedApproval.trigger_record_id}
                    </code>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requested
                  </label>
                  <p className="text-gray-900">
                    {new Date(selectedApproval.approval.requested_at).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (optional)
                  </label>
                  <PurpleGlassTextarea
                    value={comments}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(e.target.value)}
                    placeholder="Add your comments here..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <PurpleGlassButton
                  variant="secondary"
                  onClick={() => {
                    setSelectedApproval(null);
                    setComments('');
                  }}
                  glass
                  disabled={processing}
                >
                  Cancel
                </PurpleGlassButton>
                <PurpleGlassButton
                  variant="danger"
                  onClick={() => handleReject(selectedApproval.approval.id!, comments)}
                  icon={<XCircle size={16} />}
                  glass
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Reject'}
                </PurpleGlassButton>
                <PurpleGlassButton
                  variant="primary"
                  onClick={() => handleApprove(selectedApproval.approval.id!, comments)}
                  icon={<CheckCircle size={16} />}
                  glass
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Approve'}
                </PurpleGlassButton>
              </div>
            </div>
          </div>
        )}
      </PurpleGlassCard>
    </div>
  );
};

export default ApprovalInbox;
