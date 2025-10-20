import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { openFileDialog, readFileContent, getFileName, isFileTypeSupported, isTauriEnvironment } from '../utils/fileUpload';
import WebFileProcessor from '../utils/webFileProcessor';
import { parseHardwareBasket } from '../utils/hardwareBasketParser';
import { tokens, colors } from '@/styles/design-tokens';

interface SimpleFileUploadProps {
  onFileProcessed?: (result: any) => void;
  onError?: (error: string) => void;
  acceptedTypes?: string[];
  uploadType: 'hardware' | 'vmware' | 'network' | 'hardware-basket';
  label?: string;
  description?: string;
}

const SimpleFileUpload: React.FC<SimpleFileUploadProps> = ({
  onFileProcessed,
  onError,
  acceptedTypes = ['.xml', '.csv', '.txt', '.xls', '.xlsx'],
  uploadType,
  label = 'Upload File',
  description = 'Click to select files'
}) => {
  const { parseHardwareFile, processVMwareFile, setLoading, setError } = useAppStore();
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isWebEnvironment = !isTauriEnvironment();

  const handleFileProcess = async (file: File | string) => {
    setProcessing(true);
    setError(null);
    
    try {
      let result;
      
      switch (uploadType) {
        case 'hardware':
          result = await parseHardwareFile(file);
          onFileProcessed?.(result);
          break;
          
        case 'hardware-basket':
          // For hardware basket files, return the file for external processing
          onFileProcessed?.({ file });
          break;
          
        case 'vmware':
          await processVMwareFile(file);
          onFileProcessed?.(useAppStore.getState().currentEnvironment);
          break;
          
        case 'network':
          await processVMwareFile(file);
          onFileProcessed?.(useAppStore.getState().networkTopology);
          break;
          
        default:
          throw new Error(`Unsupported upload type: ${uploadType}`);
      }
    } catch (error) {
      console.error('File processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileSelect = async () => {
    if (processing) return;

    try {
      if (isWebEnvironment) {
        // Web environment - use file input
        fileInputRef.current?.click();
      } else {
        // Tauri environment - use native file dialog
        const filePath = await openFileDialog({ accept: acceptedTypes });
        if (filePath) {
          await handleFileProcess(filePath);
        }
      }
    } catch (error) {
      console.error('File selection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to select file';
      onError?.(errorMessage);
    }
  };

  const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await handleFileProcess(file);
    } catch (error) {
      console.error('File processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      onError?.(errorMessage);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ width: '100%', height: '120px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Upload Button */}
      <button
        onClick={handleFileSelect}
        disabled={processing}
        style={{
          width: '100%',
          height: '80px',
          border: '2px dashed #d1d5db',
          borderRadius: '8px',
          backgroundColor: processing ? '#f9fafb' : '#ffffff',
          cursor: processing ? 'wait' : 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          if (!processing) {
            e.currentTarget.style.borderColor = '#a855f7';
            e.currentTarget.style.backgroundColor = '#faf5ff';
          }
        }}
        onMouseLeave={(e) => {
          if (!processing) {
            e.currentTarget.style.borderColor = '#d1d5db';
            e.currentTarget.style.backgroundColor = '#ffffff';
          }
        }}
      >
        {processing ? (
          <>
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid #e5e7eb',
                borderTop: '2px solid #a855f7',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
            <span style={{ fontSize: '12px', color: tokens.semanticColors.neutral.foregroundSubtle, fontWeight: '500' }}>
              Processing...
            </span>
          </>
        ) : (
          <>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={tokens.semanticColors.neutral.foregroundSubtle}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span style={{ fontSize: '14px', color: colors.gray700, fontWeight: '500' }}>
              {label}
            </span>
          </>
        )}
      </button>

      {/* Description and Format Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: tokens.semanticColors.neutral.foregroundSubtle }}>
          {description}
        </span>
        <span style={{ fontSize: '10px', color: '#9ca3af' }}>
          {acceptedTypes.join(', ')}
        </span>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={processing}
      />

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SimpleFileUpload;
