import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { openFileDialog, readFileContent, getFileName, isFileTypeSupported, isTauriEnvironment } from '../utils/fileUpload';
import WebFileProcessor from '../utils/webFileProcessor';

interface EnhancedFileUploadProps {
  onFileProcessed?: (result: any) => void;
  onError?: (error: string) => void;
  acceptedTypes?: string[];
  uploadType: 'hardware' | 'vmware' | 'network';
  children?: React.ReactNode;
}

const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  onFileProcessed,
  onError,
  acceptedTypes = ['.xml', '.csv', '.txt', '.xls', '.xlsx'],
  uploadType,
  children
}) => {
  const { parseHardwareFile, processVMwareFile, setLoading, setError } = useAppStore();
  const [dragActive, setDragActive] = useState(false);
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
          
        case 'vmware':
          result = await processVMwareFile(file);
          onFileProcessed?.(result);
          break;
          
        case 'network':
          // For network files, we can process them as VMware for now
          result = await processVMwareFile(file);
          onFileProcessed?.(result);
          break;
          
        default:
          throw new Error(`Unsupported upload type: ${uploadType}`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileSelect = async () => {
    try {
      const result = await openFileDialog({
        multiple: false,
        accept: acceptedTypes.map(type => type.replace('.', ''))
      });
      
      if (result) {
        await handleFileProcess(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to select file';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  // Drag and drop handlers (web only)
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!isWebEnvironment) {
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file type
      if (!WebFileProcessor.isFileSupported(file)) {
        const error = `Unsupported file type. Supported formats: ${acceptedTypes.join(', ')}`;
        setError(error);
        onError?.(error);
        return;
      }
      
      await handleFileProcess(file);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileProcess(file);
    }
  };

  const getUploadMessage = () => {
    switch (uploadType) {
      case 'hardware':
        return 'Upload hardware configuration files (Dell SCP, Lenovo DCSC, HPE iQuote)';
      case 'vmware':
        return 'Upload VMware environment exports (vSphere exports, RVTools CSV)';
      case 'network':
        return 'Upload network topology files (CSV, XML)';
      default:
        return 'Upload supported files';
    }
  };

  const getProcessingMessage = () => {
    switch (uploadType) {
      case 'hardware':
        return 'Parsing hardware configuration...';
      case 'vmware':
        return 'Processing VMware environment data...';
      case 'network':
        return 'Analyzing network topology...';
      default:
        return 'Processing file...';
    }
  };

  if (children) {
    // Render custom children with click handler
    return (
      <div 
        onClick={handleFileSelect}
        style={{ cursor: processing ? 'wait' : 'pointer' }}
      >
        {children}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          style={{ display: 'none' }}
          disabled={processing}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        dragActive
          ? 'border-purple-400 bg-purple-50'
          : 'border-gray-300 hover:border-purple-400'
      } ${processing ? 'pointer-events-none opacity-75' : 'cursor-pointer'}`}
      onClick={!processing ? handleFileSelect : undefined}
      onDragEnter={isWebEnvironment ? handleDrag : undefined}
      onDragLeave={isWebEnvironment ? handleDrag : undefined}
      onDragOver={isWebEnvironment ? handleDrag : undefined}
      onDrop={isWebEnvironment ? handleDrop : undefined}
      style={{
        background: dragActive 
          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)'
          : 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderColor: dragActive ? 'rgba(168, 85, 247, 0.5)' : 'rgba(156, 163, 175, 0.5)',
      }}
    >
      {processing ? (
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <p className="text-sm text-gray-600">{getProcessingMessage()}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div>
            <p className="text-lg font-medium text-gray-700 mb-1">
              {isWebEnvironment && dragActive ? 'Drop file here' : 'Click to upload file'}
            </p>
            <p className="text-sm text-gray-500 mb-2">{getUploadMessage()}</p>
            {isWebEnvironment && (
              <p className="text-xs text-gray-400">
                Or drag and drop files here
              </p>
            )}
            {!isWebEnvironment && (
              <p className="text-xs text-blue-500">
                ✓ Desktop mode: Full backend processing available
              </p>
            )}
          </div>
          <div className="text-xs text-gray-400">
            Supported formats: {acceptedTypes.join(', ')}
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={processing}
      />
    </div>
  );
};

export default EnhancedFileUpload;
