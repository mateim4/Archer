import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PurpleGlassCard,
  PurpleGlassButton,
  PurpleGlassInput,
  PurpleGlassTextarea,
  PurpleGlassDropdown,
} from './ui';
import {
  SaveRegular,
  DismissRegular,
  AddRegular,
  DeleteRegular,
} from '@fluentui/react-icons';
import * as cmdbClient from '../api/cmdbClient';
import type {
  ConfigurationItem,
  CreateCIRequest,
  UpdateCIRequest,
  CIClass,
  CIStatus,
  CICriticality,
} from '../api/cmdbClient';
import { FluentTokens } from '../design-system/tokens';

interface CIEditorFormProps {
  ciId?: string;
  onSave?: (ci: ConfigurationItem) => void;
  onCancel?: () => void;
}

/**
 * CIEditorForm - Form for creating and editing Configuration Items
 * 
 * Features:
 * - Dynamic form based on CI class
 * - Validation for required fields
 * - Tag management
 * - Custom attributes editor
 * - Create/Edit mode
 */
const CIEditorForm: React.FC<CIEditorFormProps> = ({ ciId, onSave, onCancel }) => {
  const navigate = useNavigate();
  const isEditMode = !!ciId;

  // Form State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // CI Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ciClass, setCiClass] = useState<CIClass>('HARDWARE');
  const [ciType, setCiType] = useState('');
  const [status, setStatus] = useState<CIStatus>('PLANNED');
  const [criticality, setCriticality] = useState<CICriticality>('MEDIUM');
  const [environment, setEnvironment] = useState('');
  const [location, setLocation] = useState('');
  const [supportGroup, setSupportGroup] = useState('');
  const [vendor, setVendor] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [version, setVersion] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [fqdn, setFqdn] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [customAttributes, setCustomAttributes] = useState<Record<string, any>>({});

  // Load existing CI if in edit mode
  useEffect(() => {
    if (isEditMode && ciId) {
      loadCI();
    }
  }, [ciId, isEditMode]);

  const loadCI = async () => {
    if (!ciId) return;

    try {
      setLoading(true);
      const data = await cmdbClient.getCIById(ciId);
      const ci = data.ci;
      
      setName(ci.name);
      setDescription(ci.description || '');
      setCiClass(ci.ci_class);
      setCiType(ci.ci_type);
      setStatus(ci.status);
      setCriticality(ci.criticality);
      setEnvironment(ci.environment || '');
      setLocation(ci.location || '');
      setSupportGroup(ci.support_group || '');
      setVendor(ci.vendor || '');
      setModel(ci.model || '');
      setSerialNumber(ci.serial_number || '');
      setVersion(ci.version || '');
      setIpAddress(ci.ip_address || '');
      setFqdn(ci.fqdn || '');
      setTags(ci.tags || []);
      setCustomAttributes(ci.attributes || {});
    } catch (err) {
      console.error('Failed to load CI:', err);
      setError(err instanceof Error ? err.message : 'Failed to load CI');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!ciType.trim()) {
      setError('CI Type is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (isEditMode && ciId) {
        // Update existing CI
        const request: UpdateCIRequest = {
          name: name.trim(),
          description: description.trim() || undefined,
          ci_type: ciType.trim(),
          status,
          criticality,
          environment: environment.trim() || undefined,
          location: location.trim() || undefined,
          support_group: supportGroup.trim() || undefined,
          vendor: vendor.trim() || undefined,
          model: model.trim() || undefined,
          serial_number: serialNumber.trim() || undefined,
          version: version.trim() || undefined,
          ip_address: ipAddress.trim() || undefined,
          fqdn: fqdn.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
          attributes: Object.keys(customAttributes).length > 0 ? customAttributes : undefined,
        };

        const updatedCI = await cmdbClient.updateCI(ciId, request);
        
        if (onSave) {
          onSave(updatedCI);
        } else {
          navigate(`/app/cmdb/${ciId}`);
        }
      } else {
        // Create new CI
        const request: CreateCIRequest = {
          name: name.trim(),
          description: description.trim() || undefined,
          ci_class: ciClass,
          ci_type: ciType.trim(),
          status,
          criticality,
          environment: environment.trim() || undefined,
          location: location.trim() || undefined,
          support_group: supportGroup.trim() || undefined,
          vendor: vendor.trim() || undefined,
          model: model.trim() || undefined,
          serial_number: serialNumber.trim() || undefined,
          version: version.trim() || undefined,
          ip_address: ipAddress.trim() || undefined,
          fqdn: fqdn.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
          attributes: Object.keys(customAttributes).length > 0 ? customAttributes : undefined,
        };

        const newCI = await cmdbClient.createCI(request);
        
        if (onSave) {
          onSave(newCI);
        } else {
          navigate(`/app/cmdb/${newCI.id}`);
        }
      }
    } catch (err) {
      console.error('Failed to save CI:', err);
      setError(err instanceof Error ? err.message : 'Failed to save CI');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(isEditMode ? `/app/cmdb/${ciId}` : '/app/cmdb');
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Dropdown options
  const classOptions = [
    { key: 'HARDWARE', text: 'Hardware' },
    { key: 'SOFTWARE', text: 'Software' },
    { key: 'SERVICE', text: 'Service' },
    { key: 'NETWORK', text: 'Network' },
    { key: 'DATABASE', text: 'Database' },
    { key: 'CLOUD', text: 'Cloud' },
    { key: 'CONTAINER', text: 'Container' },
    { key: 'VIRTUAL', text: 'Virtual' },
  ];

  const statusOptions = [
    { key: 'PLANNED', text: 'Planned' },
    { key: 'ORDERED', text: 'Ordered' },
    { key: 'RECEIVED', text: 'Received' },
    { key: 'IN_STOCK', text: 'In Stock' },
    { key: 'DEPLOYED', text: 'Deployed' },
    { key: 'ACTIVE', text: 'Active' },
    { key: 'MAINTENANCE', text: 'Maintenance' },
    { key: 'OFFLINE', text: 'Offline' },
    { key: 'DECOMMISSIONED', text: 'Decommissioned' },
    { key: 'RETIRED', text: 'Retired' },
  ];

  const criticalityOptions = [
    { key: 'CRITICAL', text: 'Critical' },
    { key: 'HIGH', text: 'High' },
    { key: 'MEDIUM', text: 'Medium' },
    { key: 'LOW', text: 'Low' },
    { key: 'NONE', text: 'None' },
  ];

  const environmentOptions = [
    { key: 'Production', text: 'Production' },
    { key: 'Staging', text: 'Staging' },
    { key: 'Development', text: 'Development' },
    { key: 'Test', text: 'Test' },
  ];

  if (loading) {
    return (
      <PurpleGlassCard style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading CI...</p>
      </PurpleGlassCard>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <PurpleGlassCard style={{ padding: '32px' }}>
        {/* Header */}
        <h2 style={{
          fontSize: FluentTokens.typography.fontSize[700],
          fontWeight: FluentTokens.typography.fontWeight.semibold,
          marginBottom: '8px',
        }}>
          {isEditMode ? 'Edit Configuration Item' : 'Create Configuration Item'}
        </h2>
        <p style={{
          fontSize: FluentTokens.typography.fontSize[300],
          color: 'var(--colorNeutralForeground3)',
          marginBottom: '32px',
        }}>
          {isEditMode ? 'Update the details of this configuration item' : 'Add a new configuration item to the CMDB'}
        </p>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '24px',
            borderRadius: FluentTokens.borderRadius.medium,
            backgroundColor: 'var(--colorPaletteRedBackground1)',
            border: '1px solid var(--colorPaletteRedBorder1)',
            color: 'var(--colorPaletteRedForeground1)',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Basic Information */}
          <div>
            <h3 style={{
              fontSize: FluentTokens.typography.fontSize[500],
              fontWeight: FluentTokens.typography.fontWeight.semibold,
              marginBottom: '16px',
            }}>
              Basic Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{
                  display: 'block',
                  fontSize: FluentTokens.typography.fontSize[300],
                  fontWeight: FluentTokens.typography.fontWeight.medium,
                  marginBottom: '8px',
                }}>
                  Name <span style={{ color: 'var(--colorPaletteRedForeground1)' }}>*</span>
                </label>
                <PurpleGlassInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter CI name"
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{
                  display: 'block',
                  fontSize: FluentTokens.typography.fontSize[300],
                  fontWeight: FluentTokens.typography.fontWeight.medium,
                  marginBottom: '8px',
                }}>
                  Description
                </label>
                <PurpleGlassTextarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter CI description"
                  rows={3}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: FluentTokens.typography.fontSize[300],
                  fontWeight: FluentTokens.typography.fontWeight.medium,
                  marginBottom: '8px',
                }}>
                  Class <span style={{ color: 'var(--colorPaletteRedForeground1)' }}>*</span>
                </label>
                <PurpleGlassDropdown
                  value={ciClass}
                  onOptionSelect={(_, data) => setCiClass(data.optionValue as CIClass)}
                  options={classOptions}
                  disabled={isEditMode}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: FluentTokens.typography.fontSize[300],
                  fontWeight: FluentTokens.typography.fontWeight.medium,
                  marginBottom: '8px',
                }}>
                  Type <span style={{ color: 'var(--colorPaletteRedForeground1)' }}>*</span>
                </label>
                <PurpleGlassInput
                  value={ciType}
                  onChange={(e) => setCiType(e.target.value)}
                  placeholder="e.g., Physical Server, Database Instance"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: FluentTokens.typography.fontSize[300],
                  fontWeight: FluentTokens.typography.fontWeight.medium,
                  marginBottom: '8px',
                }}>
                  Status
                </label>
                <PurpleGlassDropdown
                  value={status}
                  onOptionSelect={(_, data) => setStatus(data.optionValue as CIStatus)}
                  options={statusOptions}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: FluentTokens.typography.fontSize[300],
                  fontWeight: FluentTokens.typography.fontWeight.medium,
                  marginBottom: '8px',
                }}>
                  Criticality
                </label>
                <PurpleGlassDropdown
                  value={criticality}
                  onOptionSelect={(_, data) => setCriticality(data.optionValue as CICriticality)}
                  options={criticalityOptions}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: FluentTokens.typography.fontSize[300],
                  fontWeight: FluentTokens.typography.fontWeight.medium,
                  marginBottom: '8px',
                }}>
                  Environment
                </label>
                <PurpleGlassDropdown
                  value={environment}
                  onOptionSelect={(_, data) => setEnvironment(data.optionValue as string)}
                  options={[{ key: '', text: 'None' }, ...environmentOptions]}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: FluentTokens.typography.fontSize[300],
                  fontWeight: FluentTokens.typography.fontWeight.medium,
                  marginBottom: '8px',
                }}>
                  Location
                </label>
                <PurpleGlassInput
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Data Center 1, Rack A12"
                />
              </div>
            </div>
          </div>

          {/* Hardware/Software Details */}
          <div>
            <h3 style={{
              fontSize: FluentTokens.typography.fontSize[500],
              fontWeight: FluentTokens.typography.fontWeight.semibold,
              marginBottom: '16px',
            }}>
              Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: FluentTokens.typography.fontSize[300],
                  fontWeight: FluentTokens.typography.fontWeight.medium,
                  marginBottom: '8px',
                }}>
                  Vendor/Manufacturer
                </label>
                <PurpleGlassInput
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g., Dell, Microsoft"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: FluentTokens.typography.fontSize[300],
                  fontWeight: FluentTokens.typography.fontWeight.medium,
                  marginBottom: '8px',
                }}>
                  Model
                </label>
                <PurpleGlassInput
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g., PowerEdge R740"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: FluentTokens.typography.fontSize[300],
                  fontWeight: FluentTokens.typography.fontWeight.medium,
                  marginBottom: '8px',
                }}>
                  Serial Number
                </label>
                <PurpleGlassInput
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g., SN123456789"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: FluentTokens.typography.fontSize[300],
                  fontWeight: FluentTokens.typography.fontWeight.medium,
                  marginBottom: '8px',
                }}>
                  Version
                </label>
                <PurpleGlassInput
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g., 2.1.0"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: FluentTokens.typography.fontSize[300],
                  fontWeight: FluentTokens.typography.fontWeight.medium,
                  marginBottom: '8px',
                }}>
                  IP Address
                </label>
                <PurpleGlassInput
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="e.g., 192.168.1.100"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: FluentTokens.typography.fontSize[300],
                  fontWeight: FluentTokens.typography.fontWeight.medium,
                  marginBottom: '8px',
                }}>
                  FQDN
                </label>
                <PurpleGlassInput
                  value={fqdn}
                  onChange={(e) => setFqdn(e.target.value)}
                  placeholder="e.g., server01.example.com"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: FluentTokens.typography.fontSize[300],
                  fontWeight: FluentTokens.typography.fontWeight.medium,
                  marginBottom: '8px',
                }}>
                  Support Group
                </label>
                <PurpleGlassInput
                  value={supportGroup}
                  onChange={(e) => setSupportGroup(e.target.value)}
                  placeholder="e.g., Infrastructure Team"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 style={{
              fontSize: FluentTokens.typography.fontSize[500],
              fontWeight: FluentTokens.typography.fontWeight.semibold,
              marginBottom: '16px',
            }}>
              Tags
            </h3>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <PurpleGlassInput
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Enter tag and press Enter"
                style={{ flex: 1 }}
              />
              <PurpleGlassButton
                icon={<AddRegular />}
                onClick={handleAddTag}
              >
                Add
              </PurpleGlassButton>
            </div>

            {tags.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '6px 12px',
                      borderRadius: FluentTokens.borderRadius.medium,
                      fontSize: FluentTokens.typography.fontSize[200],
                      backgroundColor: 'var(--colorBrandBackground2)',
                      color: 'var(--colorBrandForeground2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <DeleteRegular style={{ fontSize: '14px' }} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '24px',
            borderTop: '1px solid var(--colorNeutralStroke1)',
          }}>
            <PurpleGlassButton
              icon={<DismissRegular />}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </PurpleGlassButton>
            <PurpleGlassButton
              icon={<SaveRegular />}
              onClick={handleSave}
              appearance="primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create CI'}
            </PurpleGlassButton>
          </div>
        </div>
      </PurpleGlassCard>
    </div>
  );
};

export default CIEditorForm;
