import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Enhanced UX Hook for improved user interactions
export const useEnhancedUX = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
  }>>([]);

  // Toast notification system
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  // Enhanced loading states
  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    setIsLoading,
    toasts,
    showToast,
    withLoading
  };
};

// Enhanced form validation hook
export const useFormValidation = (initialValues: Record<string, any>, validationRules: Record<string, (value: any) => string | null>) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback((fieldName: string, value: any) => {
    const rule = validationRules[fieldName];
    if (rule) {
      const error = rule(value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error || ''
      }));
      return !error;
    }
    return true;
  }, [validationRules]);

  const handleChange = useCallback((fieldName: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    if (touched[fieldName]) {
      validate(fieldName, value);
    }
  }, [touched, validate]);

  const handleBlur = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    validate(fieldName, values[fieldName]);
  }, [values, validate]);

  const validateAll = useCallback(() => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validationRules[fieldName](values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(Object.keys(validationRules).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    return isValid;
  }, [values, validationRules]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    isValid: Object.values(errors).every(error => !error)
  };
};

// Enhanced search functionality
export const useEnhancedSearch = <T>(
  items: T[],
  searchFields: (keyof T)[],
  filterFn?: (item: T, query: string) => boolean
) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredItems = useMemo(() => {
    if (!query) return items;
    
    if (filterFn) {
      return items.filter(item => filterFn(item, query));
    }

    return items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query.toLowerCase());
        }
        return false;
      })
    );
  }, [items, query, searchFields, filterFn]);

  const updateSuggestions = useCallback((searchQuery: string) => {
    if (!searchQuery) {
      setSuggestions([]);
      return;
    }

    const uniqueValues = new Set<string>();
    items.forEach(item => {
      searchFields.forEach(field => {
        const value = item[field];
        if (typeof value === 'string' && value.toLowerCase().includes(searchQuery.toLowerCase())) {
          uniqueValues.add(value);
        }
      });
    });

    setSuggestions(Array.from(uniqueValues).slice(0, 5));
  }, [items, searchFields]);

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    updateSuggestions(searchQuery);
    setShowSuggestions(true);
  }, [updateSuggestions]);

  return {
    query,
    filteredItems,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    handleSearch,
    setQuery
  };
};

// Enhanced modal management
export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const openModal = useCallback((content: React.ReactNode) => {
    setModalContent(content);
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setModalContent(null);
    document.body.style.overflow = 'unset';
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeModal]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, closeModal]);

  return {
    isOpen,
    modalContent,
    modalRef,
    openModal,
    closeModal
  };
};

// Enhanced performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    loadTime: 0,
    interactionTime: 0
  });

  const measureRender = useCallback((startTime: number) => {
    const endTime = performance.now();
    setMetrics(prev => ({ ...prev, renderTime: endTime - startTime }));
  }, []);

  const measureLoad = useCallback(() => {
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadTime = navigationTiming.loadEventEnd - navigationTiming.loadEventStart;
    setMetrics(prev => ({ ...prev, loadTime }));
  }, []);

  const measureInteraction = useCallback((startTime: number) => {
    const endTime = performance.now();
    setMetrics(prev => ({ ...prev, interactionTime: endTime - startTime }));
  }, []);

  return {
    metrics,
    measureRender,
    measureLoad,
    measureInteraction
  };
};

// Enhanced accessibility hooks
export const useA11y = () => {
  const [announceMessage, setAnnounceMessage] = useState('');
  
  const announce = useCallback((message: string) => {
    setAnnounceMessage(message);
    setTimeout(() => setAnnounceMessage(''), 1000);
  }, []);

  const generateId = useCallback((prefix: string = 'id') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  return {
    announceMessage,
    announce,
    generateId
  };
};

// Enhanced responsive design hook
export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop'
  };
};
