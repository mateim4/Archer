/**
 * CreateIncidentModal Component
 * 
 * Pre-filled modal for creating incidents from alerts or CMDB context.
 * Supports one-click incident creation with asset linking.
 * 
 * Part of Phase 2: Integration Layer (Alert-Incident Correlation)
 */

import React, { useState, useEffect } from 'react';
import {
  DismissRegular,
  TicketDiagonalRegular,
  ErrorCircleRegular,
  WarningRegular,
  InfoRegular,
  ServerRegular,
  AlertRegular,
  PersonRegular,
  TagRegular,
} from '@fluentui/react-icons';
import { tokens } from '@fluentui/react-components';
import { PurpleGlassButton } from './PurpleGlassButton';
import { PurpleGlassInput } from './PurpleGlassInput';
import { PurpleGlassTextarea } from './PurpleGlassTextarea';
import { PurpleGlassDropdown, DropdownOption } from './PurpleGlassDropdown';
import { LinkedAssetBadge } from './LinkedAssetBadge';

export interface AlertContext {
  alertId: string;
  alertType: 'critical' | 'warning' | 'info';
  message: string;
  assetId?: string;
  assetName?: string;
  assetType?: 'CLUSTER' | 'HOST' | 'VM' | 'SWITCH';
  timestamp: string;
  metricName?: string;
  metricValue?: string;
  threshold?: string;
}

export interface CreateIncidentModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when incident is created */
  onSubmit: (incident: CreateIncidentData) => Promise<void>;
  /** Pre-fill context from an alert */
  alertContext?: AlertContext;
  /** Pre-selected asset */
  preSelectedAsset?: {
    id: string;
    name: string;
    type?: 'CLUSTER' | 'HOST' | 'VM' | 'SWITCH';
  };
}

export interface CreateIncidentData {
  title: string;
  description: string;
  ticketType: 'INCIDENT' | 'PROBLEM' | 'CHANGE' | 'SERVICE_REQUEST';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  relatedAssetId?: string;
  triggeredByAlertId?: string;
  assignee?: string;
}

const PRIORITY_OPTIONS: DropdownOption[] = [
  { value: 'P1', label: 'P1 - Critical (1h Response)' },
  { value: 'P2', label: 'P2 - High (4h Response)' },
  { value: 'P3', label: 'P3 - Medium (8h Response)' },
  { value: 'P4', label: 'P4 - Low (24h Response)' },
];

const TYPE_OPTIONS: DropdownOption[] = [
  { value: 'INCIDENT', label: 'Incident - Something is broken' },
  { value: 'PROBLEM', label: 'Problem - Root cause analysis' },
  { value: 'CHANGE', label: 'Change - Planned modification' },
  { value: 'SERVICE_REQUEST', label: 'Service Request - Standard fulfillment' },
];

// Map alert type to suggested priority
const getAlertPriority = (alertType?: 'critical' | 'warning' | 'info'): 'P1' | 'P2' | 'P3' | 'P4' => {
  switch (alertType) {
    case 'critical': return 'P1';
    case 'warning': return 'P2';
    case 'info': return 'P3';
    default: return 'P3';
  }
};

// Generate title from alert context
const generateAlertTitle = (alert?: AlertContext): string => {
  if (!alert) return '';
  const prefix = alert.alertType === 'critical' ? '[CRITICAL]' : 
                 alert.alertType === 'warning' ? '[WARNING]' : '[INFO]';
  const asset = alert.assetName ? ` on ${alert.assetName}` : '';
  return `${prefix} ${alert.message}${asset}`;
};

// Generate description from alert context
const generateAlertDescription = (alert?: AlertContext): string => {
  if (!alert) return '';
  let desc = `Alert triggered at ${new Date(alert.timestamp).toLocaleString()}\n\n`;
  desc += `Message: ${alert.message}\n`;
  if (alert.assetName) desc += `Affected Asset: ${alert.assetName}\n`;
  if (alert.metricName) desc += `Metric: ${alert.metricName}\n`;
  if (alert.metricValue) desc += `Current Value: ${alert.metricValue}\n`;
  if (alert.threshold) desc += `Threshold: ${alert.threshold}\n`;
  desc += `\nOriginal Alert ID: ${alert.alertId}`;
  return desc;
};

export const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  alertContext,
  preSelectedAsset,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ticketType, setTicketType] = useState<CreateIncidentData['ticketType']>('INCIDENT');
  const [priority, setPriority] = useState<CreateIncidentData['priority']>('P3');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill from alert context
  useEffect(() => {
    if (alertContext) {
      setTitle(generateAlertTitle(alertContext));
      setDescription(generateAlertDescription(alertContext));
      setPriority(getAlertPriority(alertContext.alertType));
      setTicketType('INCIDENT');
    }
  }, [alertContext]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setTicketType('INCIDENT');
      setPriority('P3');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title,
        description,
        ticketType,
        priority,
        relatedAssetId: alertContext?.assetId || preSelectedAsset?.id,
        triggeredByAlertId: alertContext?.alertId,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const linkedAsset = alertContext?.assetId 
    ? { id: alertContext.assetId, name: alertContext.assetName || 'Unknown', type: alertContext.assetType }
    : preSelectedAsset;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '560px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(40px) saturate(180%)',
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.3)',
          overflow: 'hidden',
          zIndex: 9999,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: alertContext ? 'rgba(239, 68, 68, 0.1)' : 'rgba(139, 92, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: alertContext ? '#ef4444' : '#8b5cf6',
            }}>
              {alertContext ? <AlertRegular style={{ fontSize: '20px' }} /> : <TicketDiagonalRegular style={{ fontSize: '20px' }} />}
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: tokens.colorNeutralForeground1,
              }}>
                {alertContext ? 'Create Incident from Alert' : 'Create New Ticket'}
              </h2>
              {alertContext && (
                <p style={{
                  margin: '2px 0 0 0',
                  fontSize: '12px',
                  color: tokens.colorNeutralForeground3,
                }}>
                  Pre-filled from alert • SLA timer will start on creation
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              borderRadius: '8px',
              color: tokens.colorNeutralForeground3,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.color = tokens.colorNeutralForeground1;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = tokens.colorNeutralForeground3;
            }}
          >
            <DismissRegular style={{ fontSize: '20px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Linked Asset Banner */}
          {linkedAsset && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(139, 92, 246, 0.05)',
              borderRadius: '10px',
              border: '1px solid rgba(139, 92, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <ServerRegular style={{ color: '#8b5cf6', fontSize: '16px' }} />
              <span style={{ fontSize: '13px', color: tokens.colorNeutralForeground2 }}>
                Linked to:
              </span>
              <LinkedAssetBadge
                assetId={linkedAsset.id}
                assetName={linkedAsset.name}
                assetType={linkedAsset.type}
                status={alertContext?.alertType === 'critical' ? 'critical' : alertContext?.alertType === 'warning' ? 'warning' : undefined}
                size="small"
                showChevron={false}
                interactive={false}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '10px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <ErrorCircleRegular />
              {error}
            </div>
          )}

          {/* Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <PurpleGlassDropdown
              label="Type"
              options={TYPE_OPTIONS}
              value={ticketType}
              onChange={(val) => setTicketType(val as CreateIncidentData['ticketType'])}
              glass="none"
              required
            />
            <PurpleGlassDropdown
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={(val) => setPriority(val as CreateIncidentData['priority'])}
              glass="none"
              required
            />
          </div>

          <PurpleGlassInput
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of the issue"
            glass="none"
            required
            validationState={error && !title.trim() ? 'error' : 'default'}
          />

          <PurpleGlassTextarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the issue, symptoms, and impact..."
            glass="none"
            rows={6}
            showCharacterCount
            maxLength={2000}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
            {alertContext && (
              <span>Alert will be marked as "Incident Created"</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <PurpleGlassButton variant="secondary" onClick={onClose}>
              Cancel
            </PurpleGlassButton>
            <PurpleGlassButton
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </PurpleGlassButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateIncidentModal;
