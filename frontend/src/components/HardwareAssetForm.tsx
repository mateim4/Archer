import React, { useState, useEffect } from 'react';
import { HardwareAsset, AssetStatus } from '../store/useAppStore';

interface HardwareAssetFormProps {
  asset?: HardwareAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (asset: Partial<HardwareAsset>) => void;
}

const HardwareAssetForm: React.FC<HardwareAssetFormProps> = ({
  asset,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    model: '',
    cpu_cores: 0,
    memory_gb: 0,
    storage_capacity_gb: 0,
    status: AssetStatus.Available,
    location: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name,
        manufacturer: asset.manufacturer,
        model: asset.model,
        cpu_cores: asset.cpu_cores,
        memory_gb: asset.memory_gb,
        storage_capacity_gb: asset.storage_capacity_gb,
        status: asset.status,
        location: asset.location
      });
    } else {
      setFormData({
        name: '',
        manufacturer: '',
        model: '',
        cpu_cores: 0,
        memory_gb: 0,
        storage_capacity_gb: 0,
        status: AssetStatus.Available,
        location: ''
      });
    }
    setErrors({});
  }, [asset, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.manufacturer.trim()) newErrors.manufacturer = 'Manufacturer is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (formData.cpu_cores <= 0) newErrors.cpu_cores = 'CPU cores must be greater than 0';
    if (formData.memory_gb <= 0) newErrors.memory_gb = 'Memory must be greater than 0';
    if (formData.storage_capacity_gb <= 0) newErrors.storage_capacity_gb = 'Storage must be greater than 0';
    if (!formData.location.trim()) newErrors.location = 'Location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = asset ? { ...formData, id: asset.id } : formData;
      onSubmit(submitData);
      onClose();
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '2px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'Oxanium, sans-serif',
    transition: 'border-color 0.3s ease',
    background: 'rgba(255, 255, 255, 0.8)'
  };

  const errorInputStyle = {
    ...inputStyle,
    borderColor: '#ef4444'
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '24px',
            borderBottom: '2px solid rgba(99, 102, 241, 0.1)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: '600',
              color: '#6366f1',
              fontFamily: 'Oxanium, sans-serif'
            }}>
              {asset ? '✏️ Edit Hardware Asset' : '<span style="color: white">+</span> Add Hardware Asset'}
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Basic Information */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '500',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    style={errors.name ? errorInputStyle : inputStyle}
                    placeholder="e.g., Dell PowerEdge R750 #1"
                  />
                  {errors.name && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                      {errors.name}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '500',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    style={errors.location ? errorInputStyle : inputStyle}
                    placeholder="e.g., Rack A-01, Slot 3"
                  />
                  {errors.location && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                      {errors.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Hardware Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '500',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Manufacturer *
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                    style={errors.manufacturer ? errorInputStyle : inputStyle}
                    placeholder="e.g., Dell, HPE, Lenovo"
                  />
                  {errors.manufacturer && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                      {errors.manufacturer}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '500',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Model *
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    style={errors.model ? errorInputStyle : inputStyle}
                    placeholder="e.g., PowerEdge R750"
                  />
                  {errors.model && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                      {errors.model}
                    </div>
                  )}
                </div>
              </div>

              {/* Specifications */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '500',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    CPU Cores *
                  </label>
                  <input
                    type="number"
                    value={formData.cpu_cores}
                    onChange={(e) => handleChange('cpu_cores', parseInt(e.target.value) || 0)}
                    style={errors.cpu_cores ? errorInputStyle : inputStyle}
                    placeholder="64"
                    min="1"
                  />
                  {errors.cpu_cores && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                      {errors.cpu_cores}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '500',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Memory (GB) *
                  </label>
                  <input
                    type="number"
                    value={formData.memory_gb}
                    onChange={(e) => handleChange('memory_gb', parseInt(e.target.value) || 0)}
                    style={errors.memory_gb ? errorInputStyle : inputStyle}
                    placeholder="512"
                    min="1"
                  />
                  {errors.memory_gb && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                      {errors.memory_gb}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '500',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Storage (GB) *
                  </label>
                  <input
                    type="number"
                    value={formData.storage_capacity_gb}
                    onChange={(e) => handleChange('storage_capacity_gb', parseInt(e.target.value) || 0)}
                    style={errors.storage_capacity_gb ? errorInputStyle : inputStyle}
                    placeholder="7680"
                    min="1"
                  />
                  {errors.storage_capacity_gb && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                      {errors.storage_capacity_gb}
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value as AssetStatus)}
                  style={{
                    ...inputStyle,
                    cursor: 'pointer'
                  }}
                >
                  {Object.values(AssetStatus).map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '2px solid rgba(99, 102, 241, 0.1)'
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '12px 24px',
                  border: '2px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: '#6366f1',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Oxanium, sans-serif'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Oxanium, sans-serif'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {asset ? 'Update Asset' : 'Create Asset'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default HardwareAssetForm;
