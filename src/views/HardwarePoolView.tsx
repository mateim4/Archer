import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
  Button,
  Spinner,
} from '@fluentui/react-components';
import HardwareAssetForm from '../components/HardwareAssetForm';
import AssetLockForm from '../components/AssetLockForm';
import { HardwareAsset } from '../store/useAppStore';
import '../hardware-pool-design.css';

const HardwarePoolView: React.FC = () => {
  const {
    hardwarePoolAssets,
    listHardwareAssets,
    createHardwareAsset,
    updateHardwareAsset,
    deleteHardwareAsset,
    lockHardwareAsset,
    loading,
    error
  } = useAppStore();

  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Partial<HardwareAsset> | null>(null);

  const [isLockFormOpen, setIsLockFormOpen] = useState(false);
  const [lockingAssetId, setLockingAssetId] = useState<string | null>(null);

  useEffect(() => {
    listHardwareAssets();
  }, [listHardwareAssets]);

  const handleCreate = () => {
    setEditingAsset(null);
    setIsAssetFormOpen(true);
  };

  const handleEdit = (asset: HardwareAsset) => {
    setEditingAsset(asset);
    setIsAssetFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      deleteHardwareAsset(id);
    }
  };

  const handleOpenLockForm = (assetId: string) => {
    setLockingAssetId(assetId);
    setIsLockFormOpen(true);
  };

  const handleCloseForms = () => {
    setIsAssetFormOpen(false);
    setEditingAsset(null);
    setIsLockFormOpen(false);
    setLockingAssetId(null);
  };

  const handleAssetSubmit = (asset: Partial<HardwareAsset>) => {
    if (asset.id) {
      updateHardwareAsset(asset as HardwareAsset);
    } else {
      createHardwareAsset(asset as Omit<HardwareAsset, 'id' | 'created_at' | 'updated_at'>);
    }
    handleCloseForms();
  };

  const handleLockSubmit = (assetId: string, projectId: string, startDate: string, endDate: string) => {
    lockHardwareAsset(assetId, projectId, startDate, endDate);
    handleCloseForms();
  };

  if (loading && hardwarePoolAssets.length === 0) {
    return (
      <div className="hardware-pool-loading">
        <Spinner label="Loading hardware assets..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="hardware-pool-container">
        <div className="hardware-pool-error">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="hardware-pool-container">
      <div className="hardware-pool-header">
        <h1 className="hardware-pool-title">Hardware Pool</h1>
        <Button 
          appearance="primary" 
          onClick={handleCreate}
          className="hardware-pool-primary-btn"
        >
          Create Asset
        </Button>
      </div>

      <Table className="hardware-pool-table">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Manufacturer</TableHeaderCell>
            <TableHeaderCell>Model</TableHeaderCell>
            <TableHeaderCell>CPU Cores</TableHeaderCell>
            <TableHeaderCell>Memory (GB)</TableHeaderCell>
            <TableHeaderCell>Storage (GB)</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Location</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hardwarePoolAssets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell>{asset.name}</TableCell>
              <TableCell>{asset.manufacturer}</TableCell>
              <TableCell>{asset.model}</TableCell>
              <TableCell>{asset.cpu_cores}</TableCell>
              <TableCell>{asset.memory_gb}</TableCell>
              <TableCell>{asset.storage_capacity_gb}</TableCell>
              <TableCell>
                <span className={`hardware-pool-status-${asset.status.toLowerCase()}`}>
                  {asset.status}
                </span>
              </TableCell>
              <TableCell>{asset.location}</TableCell>
              <TableCell>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button 
                    size="small" 
                    onClick={() => handleEdit(asset)}
                    className="hardware-pool-action-btn hardware-pool-edit-btn"
                  >
                    Edit
                  </Button>
                  <Button 
                    size="small" 
                    appearance="outline" 
                    onClick={() => handleOpenLockForm(asset.id)}
                    className="hardware-pool-action-btn hardware-pool-lock-btn"
                  >
                    Lock
                  </Button>
                  <Button 
                    size="small" 
                    appearance="subtle" 
                    onClick={() => handleDelete(asset.id)}
                    className="hardware-pool-action-btn hardware-pool-delete-btn"
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <HardwareAssetForm
        asset={editingAsset}
        open={isAssetFormOpen}
        onClose={handleCloseForms}
        onSubmit={handleAssetSubmit}
      />

      {lockingAssetId && (
        <AssetLockForm
          assetId={lockingAssetId}
          open={isLockFormOpen}
          onClose={handleCloseForms}
          onSubmit={handleLockSubmit}
        />
      )}
    </div>
  );
};

export default HardwarePoolView;
