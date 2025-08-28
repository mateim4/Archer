import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Input,
  Label,
  Select,
  Field,
} from '@fluentui/react-components';
import { HardwareAsset, AssetStatus } from '../store/useAppStore';
import '../hardware-pool-design.css';

interface HardwareAssetFormProps {
  asset: Partial<HardwareAsset> | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (asset: Partial<HardwareAsset>) => void;
}

const HardwareAssetForm: React.FC<HardwareAssetFormProps> = ({ asset, open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<HardwareAsset>>({});

  useEffect(() => {
    if (asset) {
      setFormData(asset);
    } else {
      setFormData({
        name: '',
        manufacturer: '',
        model: '',
        cpu_cores: 0,
        memory_gb: 0,
        storage_capacity_gb: 0,
        status: AssetStatus.Available,
        location: '',
      });
    }
  }, [asset, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogSurface className="hardware-pool-dialog">
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <DialogTitle className="hardware-pool-dialog-title">
              {asset?.id ? 'Edit' : 'Create'} Hardware Asset
            </DialogTitle>
            <DialogContent style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <Field label="Name" required className="hardware-pool-form-field">
                <Input 
                  name="name" 
                  value={formData.name || ''} 
                  onChange={handleChange}
                  className="hardware-pool-form-input"
                />
              </Field>
              <Field label="Manufacturer" required className="hardware-pool-form-field">
                <Input 
                  name="manufacturer" 
                  value={formData.manufacturer || ''} 
                  onChange={handleChange}
                  className="hardware-pool-form-input"
                />
              </Field>
              <Field label="Model" required className="hardware-pool-form-field">
                <Input 
                  name="model" 
                  value={formData.model || ''} 
                  onChange={handleChange}
                  className="hardware-pool-form-input"
                />
              </Field>
              <Field label="Location" required className="hardware-pool-form-field">
                <Input 
                  name="location" 
                  value={formData.location || ''} 
                  onChange={handleChange}
                  className="hardware-pool-form-input"
                />
              </Field>
              <Field label="CPU Cores" required className="hardware-pool-form-field">
                <Input 
                  type="number" 
                  name="cpu_cores" 
                  value={String(formData.cpu_cores || 0)} 
                  onChange={handleNumberChange}
                  className="hardware-pool-form-input"
                />
              </Field>
              <Field label="Memory (GB)" required className="hardware-pool-form-field">
                <Input 
                  type="number" 
                  name="memory_gb" 
                  value={String(formData.memory_gb || 0)} 
                  onChange={handleNumberChange}
                  className="hardware-pool-form-input"
                />
              </Field>
              <Field label="Storage (GB)" required className="hardware-pool-form-field">
                <Input 
                  type="number" 
                  name="storage_capacity_gb" 
                  value={String(formData.storage_capacity_gb || 0)} 
                  onChange={handleNumberChange}
                  className="hardware-pool-form-input"
                />
              </Field>
              <Field label="Status" required className="hardware-pool-form-field">
                <Select 
                  name="status" 
                  value={formData.status || AssetStatus.Available} 
                  onChange={handleChange}
                  className="hardware-pool-form-input"
                >
                  {Object.values(AssetStatus).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </Field>
            </DialogContent>
            <DialogActions>
              <Button 
                type="button" 
                onClick={onClose}
                appearance="secondary"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                appearance="primary"
                className="hardware-pool-primary-btn"
              >
                {asset?.id ? 'Save' : 'Create'}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
};

export default HardwareAssetForm;
