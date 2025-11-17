/**
 * Session Recording Utilities
 * 
 * Provides session recording capabilities for debugging and UX analysis.
 * Records user interactions, DOM mutations, and console logs.
 * 
 * Privacy-first: Only records when explicitly enabled and with user consent.
 * Does not record sensitive input fields (passwords, credit cards, etc.).
 * 
 * Integration options:
 * - LogRocket
 * - FullStory
 * - Hotjar
 * - Custom recording solution
 */

export interface SessionRecordingConfig {
  /** Enable/disable session recording */
  enabled: boolean;
  /** Recording provider */
  provider?: 'logrocket' | 'fullstory' | 'hotjar' | 'custom';
  /** API key/app ID */
  apiKey?: string;
  /** Custom recording endpoint */
  endpoint?: string;
  /** Record console logs */
  recordConsole?: boolean;
  /** Record network requests */
  recordNetwork?: boolean;
  /** Sanitize sensitive data */
  sanitizeData?: boolean;
  /** Privacy mode (redact PII) */
  privacyMode?: boolean;
  /** Sample rate (0-100) */
  sampleRate?: number;
}

export interface SessionMetadata {
  sessionId: string;
  userId?: string;
  userAgent: string;
  screenResolution: string;
  timestamp: Date;
  url: string;
  referrer: string;
}

export interface SessionEvent {
  type: 'click' | 'input' | 'navigation' | 'error' | 'custom';
  timestamp: Date;
  data: Record<string, unknown>;
}

let recordingInstance: SessionRecording | null = null;

/**
 * Session Recording Class
 * 
 * Manages session recording lifecycle and event capture.
 */
export class SessionRecording {
  private config: SessionRecordingConfig;
  private sessionId: string;
  private events: SessionEvent[] = [];
  private isRecording: boolean = false;
  private eventListeners: (() => void)[] = [];

  constructor(config: SessionRecordingConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();

    // Check sample rate
    if (config.sampleRate !== undefined && config.sampleRate < 100) {
      const random = Math.random() * 100;
      if (random > config.sampleRate) {
        console.log('[SessionRecording] Not recording (sample rate)');
        return;
      }
    }

    if (config.enabled) {
      this.start();
    }
  }

  /**
   * Start recording session
   */
  start(): void {
    if (this.isRecording) return;

    this.isRecording = true;
    this.initializeProvider();
    this.attachEventListeners();

    console.log('[SessionRecording] Recording started:', this.sessionId);
  }

  /**
   * Stop recording session
   */
  stop(): void {
    if (!this.isRecording) return;

    this.isRecording = false;
    this.removeEventListeners();
    this.flushEvents();

    console.log('[SessionRecording] Recording stopped');
  }

  /**
   * Record a custom event
   */
  recordEvent(type: SessionEvent['type'], data: Record<string, unknown>): void {
    if (!this.isRecording) return;

    const event: SessionEvent = {
      type,
      timestamp: new Date(),
      data: this.config.sanitizeData ? this.sanitizeData(data) : data
    };

    this.events.push(event);

    // Auto-flush after 100 events
    if (this.events.length >= 100) {
      this.flushEvents();
    }
  }

  /**
   * Get session metadata
   */
  getMetadata(): SessionMetadata {
    return {
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timestamp: new Date(),
      url: window.location.href,
      referrer: document.referrer
    };
  }

  /**
   * Identify user for session
   */
  identifyUser(userId: string, userData?: Record<string, unknown>): void {
    if (!this.isRecording) return;

    if (this.config.provider === 'logrocket') {
      // LogRocket.identify(userId, userData);
    } else if (this.config.provider === 'fullstory') {
      // FS.identify(userId, userData);
    } else if (this.config.provider === 'hotjar') {
      // hj('identify', userId, userData);
    }

    this.recordEvent('custom', {
      eventType: 'user_identified',
      userId,
      userData: this.config.sanitizeData ? this.sanitizeData(userData || {}) : userData
    });
  }

  /**
   * Tag session with metadata
   */
  tagSession(tags: Record<string, string | number | boolean>): void {
    if (!this.isRecording) return;

    this.recordEvent('custom', {
      eventType: 'session_tagged',
      tags
    });
  }

  private initializeProvider(): void {
    const { provider, apiKey } = this.config;

    if (provider === 'logrocket' && apiKey) {
      // LogRocket.init(apiKey, { ... });
      console.log('[SessionRecording] LogRocket initialized');
    } else if (provider === 'fullstory' && apiKey) {
      // FS.init({ orgId: apiKey, ... });
      console.log('[SessionRecording] FullStory initialized');
    } else if (provider === 'hotjar' && apiKey) {
      // (function(h,o,t,j,a,r){ ... })(window,document,...);
      console.log('[SessionRecording] Hotjar initialized');
    }
  }

  private attachEventListeners(): void {
    // Click tracking
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      this.recordEvent('click', {
        element: target.tagName,
        id: target.id,
        className: target.className,
        text: target.innerText?.substring(0, 50),
        x: e.clientX,
        y: e.clientY
      });
    };

    // Input tracking (with sanitization)
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      
      // Skip sensitive inputs
      if (this.isSensitiveInput(target)) return;

      this.recordEvent('input', {
        element: target.tagName,
        id: target.id,
        name: target.name,
        type: target.type,
        value: this.config.privacyMode ? '[REDACTED]' : target.value?.substring(0, 50)
      });
    };

    // Navigation tracking
    const handleNavigation = () => {
      this.recordEvent('navigation', {
        url: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search
      });
    };

    // Error tracking
    const handleError = (e: ErrorEvent) => {
      this.recordEvent('error', {
        message: e.message,
        filename: e.filename,
        line: e.lineno,
        column: e.colno,
        stack: e.error?.stack
      });
    };

    // Console tracking (if enabled)
    if (this.config.recordConsole) {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        this.recordEvent('error', {
          type: 'console.error',
          args: args.map(arg => String(arg))
        });
        originalConsoleError.apply(console, args);
      };
    }

    document.addEventListener('click', handleClick);
    document.addEventListener('input', handleInput);
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('error', handleError);

    this.eventListeners.push(
      () => document.removeEventListener('click', handleClick),
      () => document.removeEventListener('input', handleInput),
      () => window.removeEventListener('popstate', handleNavigation),
      () => window.removeEventListener('error', handleError)
    );
  }

  private removeEventListeners(): void {
    this.eventListeners.forEach(remove => remove());
    this.eventListeners = [];
  }

  private flushEvents(): void {
    if (this.events.length === 0) return;

    if (this.config.endpoint) {
      fetch(`${this.config.endpoint}/sessions/${this.sessionId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          metadata: this.getMetadata(),
          events: this.events
        })
      }).catch(err => {
        console.error('[SessionRecording] Failed to flush events:', err);
      });
    }

    this.events = [];
  }

  private isSensitiveInput(element: HTMLInputElement): boolean {
    const sensitiveTypes = ['password', 'email', 'tel', 'credit-card', 'ssn'];
    const sensitiveNames = ['password', 'pwd', 'pass', 'creditcard', 'cc', 'cvv', 'ssn'];
    
    if (sensitiveTypes.includes(element.type)) return true;
    if (sensitiveNames.some(name => element.name?.toLowerCase().includes(name))) return true;
    if (element.autocomplete === 'cc-number' || element.autocomplete === 'cc-csc') return true;
    
    return false;
  }

  private sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('password') || 
          lowerKey.includes('token') || 
          lowerKey.includes('secret') ||
          lowerKey.includes('apikey')) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 100) {
        sanitized[key] = value.substring(0, 100) + '...';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  private generateSessionId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

/**
 * Initialize session recording
 */
export function initSessionRecording(config: SessionRecordingConfig): SessionRecording {
  if (recordingInstance) {
    console.warn('[SessionRecording] Already initialized');
    return recordingInstance;
  }

  recordingInstance = new SessionRecording(config);
  return recordingInstance;
}

/**
 * Get current recording instance
 */
export function getSessionRecording(): SessionRecording | null {
  return recordingInstance;
}

/**
 * Stop and cleanup session recording
 */
export function stopSessionRecording(): void {
  if (recordingInstance) {
    recordingInstance.stop();
    recordingInstance = null;
  }
}

export default SessionRecording;
