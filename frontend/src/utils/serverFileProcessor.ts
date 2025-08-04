// Server-side file processing service
// Handles Excel file conversion and processing via backend server

interface ServerResponse {
  success: boolean;
  filename: string;
  csvData?: string;
  environment?: any; // For parsed RVTools data
  fileType?: string;
  sheetName?: string;
  message: string;
  error?: string;
}

class ServerFileProcessor {
  private serverUrl: string;

  constructor() {
    // Try to detect if server is running locally
    this.serverUrl = 'http://localhost:3000';
  }

  /**
   * Check if the server is available
   */
  async isServerAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Convert Excel file to CSV using server
   */
  async convertExcelToCSV(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.serverUrl}/api/convert-excel`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server processing failed');
      }

      const result: ServerResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process file');
      }

      return result.csvData || '';
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Server processing failed: ${error.message}`);
      }
      throw new Error('Server processing failed: Unknown error');
    }
  }

  /**
   * Process VMware file (Excel or CSV) using server with real RVTools parsing
   */
  async processVMwareFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.serverUrl}/api/process-vmware`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server processing failed');
      }

      const result: ServerResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process VMware file');
      }

      // Return parsed environment data for all supported files now
      if (result.environment) {
        console.log('Received parsed environment data:', result.environment);
        return result.environment;
      } else if (result.csvData) {
        console.log('Received CSV data for client-side processing');
        return result.csvData;
      } else {
        throw new Error('No valid data received from server');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`VMware processing failed: ${error.message}`);
      }
      throw new Error('VMware processing failed: Unknown error');
    }
  }

  /**
   * Check if file needs server processing
   */
  needsServerProcessing(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension === 'xlsx' || extension === 'xls';
  }
}

export default ServerFileProcessor;
