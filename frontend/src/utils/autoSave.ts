// Global Auto-Save Utility
export class AutoSaveManager {
  private static instance: AutoSaveManager;
  private saveInterval: NodeJS.Timeout | null = null;
  private pendingChanges: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): AutoSaveManager {
    if (!AutoSaveManager.instance) {
      AutoSaveManager.instance = new AutoSaveManager();
    }
    return AutoSaveManager.instance;
  }

  // Start auto-save with 30-second intervals
  startAutoSave(): void {
    if (this.saveInterval) return; // Already running

    this.saveInterval = setInterval(() => {
      this.saveAllPendingChanges();
    }, 30000);

    console.log('Auto-save started - saving every 30 seconds');
  }

  // Stop auto-save
  stopAutoSave(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
      console.log('Auto-save stopped');
    }
  }

  // Add data to be auto-saved
  addToSave(key: string, data: any): void {
    this.pendingChanges.set(key, data);
  }

  // Save all pending changes to localStorage
  private saveAllPendingChanges(): void {
    if (this.pendingChanges.size === 0) return;

    this.pendingChanges.forEach((data, key) => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error(`Failed to save ${key}:`, error);
      }
    });

    console.log(`Auto-saved ${this.pendingChanges.size} items at:`, new Date().toLocaleTimeString());
  }

  // Load data from localStorage
  load<T>(key: string, defaultValue: T): T {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return defaultValue;
    }
  }

  // Clear specific key
  clear(key: string): void {
    this.pendingChanges.delete(key);
    localStorage.removeItem(key);
  }

  // Clear all auto-save data
  clearAll(): void {
    this.pendingChanges.clear();
    // Only clear keys that we manage
    const keysToRemove = ['hardwareBasket', 'activeTab', 'calculationSettings', 'settingsFormData'];
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

// Export singleton instance
export const autoSave = AutoSaveManager.getInstance();
