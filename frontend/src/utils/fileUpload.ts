// Cross-platform file upload utility for both Tauri and web environments

/**
 * Check if we're running in a Tauri environment
 */
export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && window.__TAURI_IPC__ !== undefined;
};

/**
 * Cross-platform file upload that works in both Tauri and web environments
 */
export const openFileDialog = async (options?: {
  multiple?: boolean;
  accept?: string[];
}): Promise<string | File | null> => {
  if (isTauriEnvironment()) {
    // Use Tauri file dialog
    try {
      const { open } = await import('@tauri-apps/api/dialog');
      const selected = await open({
        multiple: options?.multiple || false,
        filters: options?.accept ? [{
          name: 'Supported files',
          extensions: options.accept
        }] : undefined
      });
      
      return typeof selected === 'string' ? selected : null;
    } catch (error) {
      console.error('Tauri file dialog error:', error);
      throw error;
    }
  } else {
    // Use HTML5 File API for web
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = options?.multiple || false;
      
      if (options?.accept) {
        input.accept = options.accept.map(ext => `.${ext}`).join(',');
      }
      
      input.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        resolve(file || null);
      };
      
      input.oncancel = () => resolve(null);
      input.onerror = () => reject(new Error('File selection failed'));
      
      // Trigger file dialog
      input.click();
    });
  }
};

/**
 * Read file content based on environment
 */
export const readFileContent = async (fileOrPath: string | File): Promise<string> => {
  if (typeof fileOrPath === 'string') {
    // Tauri environment - file path
    if (isTauriEnvironment()) {
      const { readTextFile } = await import('@tauri-apps/api/fs');
      return await readTextFile(fileOrPath);
    } else {
      throw new Error('File path provided but not in Tauri environment');
    }
  } else {
    // Web environment - File object
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          resolve(content);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(fileOrPath);
    });
  }
};

/**
 * Get file name from file or path
 */
export const getFileName = (fileOrPath: string | File): string => {
  if (typeof fileOrPath === 'string') {
    return fileOrPath.split('/').pop() || fileOrPath.split('\\').pop() || 'Unknown file';
  } else {
    return fileOrPath.name;
  }
};

/**
 * Check if file extension is supported
 */
export const isFileTypeSupported = (fileOrPath: string | File, supportedExtensions: string[]): boolean => {
  const fileName = getFileName(fileOrPath);
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? supportedExtensions.includes(extension) : false;
};
