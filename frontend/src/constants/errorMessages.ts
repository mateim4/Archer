export const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  'Failed to fetch': 'Unable to connect to the server. Please check your internet connection and try again.',
  'Network request failed': 'Network error. Please check your connection and retry.',
 
  // API errors
  'Failed to load projects': 'Unable to load projects. Please refresh the page or try again later.',
  'Failed to create project': 'Project creation failed. Please check your input and try again.',
  'Failed to update project': 'Could not save changes. Please try again.',
  'Failed to delete project': 'Unable to delete project. Please try again.',
 
  // File upload errors
  'Failed to process VMware file': 'Could not process the VMware file. Please ensure it\'s a valid RVTools export.',
  'File too large': 'File size exceeds 50MB limit. Please use a smaller file.',
  'Invalid file format': 'File format not supported. Please upload a valid .xlsx or .csv file.',
 
  // Validation errors
  'Project name already exists': 'A project with this name already exists. Please choose a different name.',
  'Invalid input': 'Please check your input and try again.',
 
  // Authorization errors
  'Unauthorized': 'Session expired. Please log in again.',
  'Forbidden': 'You don\'t have permission to perform this action.',
 
  // Default
  'default': 'An unexpected error occurred. Please try again or contact support if the problem persists.'
};
