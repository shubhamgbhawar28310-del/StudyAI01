/**
 * Safe Storage Utility
 * Handles localStorage quota issues with compression, fallbacks, and data limiting
 */

import { indexedDBStorage, isIndexedDBSupported } from './indexedDBStorage';

interface SafeStorageOptions {
  maxDataSize?: number; // Maximum size in bytes (default: 4MB)
  compressionThreshold?: number; // Compress if data exceeds this size (default: 2MB)
  enableWarnings?: boolean; // Enable console warnings (default: true)
}

interface StorageStats {
  used: number;
  quota: number;
  percentage: number;
  warning: boolean;
}

class SafeStorage {
  private options: Required<SafeStorageOptions>;
  private fallbackStorage: Map<string, any> = new Map();

  constructor(options: SafeStorageOptions = {}) {
    this.options = {
      maxDataSize: 4 * 1024 * 1024, // 4MB
      compressionThreshold: 2 * 1024 * 1024, // 2MB
      enableWarnings: true,
      ...options
    };
  }

  /**
   * Estimate the size of data in bytes
   */
  private getSizeInBytes(data: any): number {
    try {
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      return new Blob([str]).size;
    } catch (error) {
      console.error('Failed to estimate data size:', error);
      return 0;
    }
  }

  /**
   * Compress data by removing non-essential fields
   */
  private compressData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const compressed = { ...data };

    // Compress tasks: keep only essential fields
    if (compressed.tasks && Array.isArray(compressed.tasks)) {
      compressed.tasks = compressed.tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        completed: task.completed,
        priority: task.priority,
        difficulty: task.difficulty,
        subject: task.subject,
        dueDate: task.dueDate,
        progress: task.progress,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        pomodoroSessions: task.pomodoroSessions,
        flashcardsGenerated: task.flashcardsGenerated
      }));
    }

    // Compress flashcards: limit history
    if (compressed.flashcards && Array.isArray(compressed.flashcards)) {
      compressed.flashcards = compressed.flashcards.slice(-100); // Keep last 100 flashcards
    }

    // Compress pomodoro sessions: keep recent ones
    if (compressed.pomodoroSessions && Array.isArray(compressed.pomodoroSessions)) {
      compressed.pomodoroSessions = compressed.pomodoroSessions
        .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 200); // Keep last 200 sessions
    }

    // Compress materials: remove large content
    if (compressed.materials && Array.isArray(compressed.materials)) {
      compressed.materials = compressed.materials.map((material: any) => ({
        ...material,
        content: material.content?.length > 10000 ?
          material.content.substring(0, 10000) + '...[truncated]' :
          material.content
      }));
    }

    return compressed;
  }

  /**
   * Get available storage space estimate
   */
  private getStorageStats(): StorageStats {
    if (typeof window === 'undefined') {
      return { used: 0, quota: this.options.maxDataSize, percentage: 0, warning: false };
    }

    try {
      // Estimate used space by checking all localStorage keys
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          used += this.getSizeInBytes(value);
        }
      }

      const percentage = Math.min(100, (used / this.options.maxDataSize) * 100);
      const warning = percentage > 80; // Warning at 80%

      return {
        used,
        quota: this.options.maxDataSize,
        percentage,
        warning
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { used: 0, quota: this.options.maxDataSize, percentage: 0, warning: false };
    }
  }

  /**
   * Check if data can be stored safely
   */
  private canStoreData(data: any, key: string): boolean {
    const dataSize = this.getSizeInBytes(data);
    const stats = this.getStorageStats();

    if (dataSize > this.options.maxDataSize) {
      if (this.options.enableWarnings) {
        console.warn(`Data size (${(dataSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${this.options.maxDataSize / 1024 / 1024}MB)`);
      }
      return false;
    }

    if (stats.used + dataSize > this.options.maxDataSize) {
      if (this.options.enableWarnings) {
        console.warn(`Storing this data would exceed storage quota. Used: ${(stats.used / 1024 / 1024).toFixed(2)}MB, Data: ${(dataSize / 1024 / 1024).toFixed(2)}MB`);
      }
      return false;
    }

    return true;
  }

  /**
   * Store data with fallbacks
   */
  async setItem(key: string, value: any): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    let dataToStore = value;

    // Compress if needed
    const rawSize = this.getSizeInBytes(dataToStore);
    if (rawSize > this.options.compressionThreshold) {
      if (this.options.enableWarnings) {
        console.warn(`Data size ${(rawSize / 1024 / 1024).toFixed(2)}MB exceeds compression threshold, compressing...`);
      }
      dataToStore = this.compressData(dataToStore);
    }

    // Check if we can store the data
    if (!this.canStoreData(dataToStore, key)) {
      // Try compressing more aggressively
      dataToStore = this.compressData(dataToStore); // Compress again if already compressed
      if (!this.canStoreData(dataToStore, key)) {
        // Fall back to IndexedDB
        if (isIndexedDBSupported()) {
          try {
            await indexedDBStorage.setItem(key, JSON.stringify(dataToStore));
            this.fallbackStorage.set(key, 'indexeddb');
            if (this.options.enableWarnings) {
              console.warn(`Data stored in IndexedDB due to localStorage quota limits`);
            }
            return true;
          } catch (error) {
            console.error('Failed to store in IndexedDB:', error);
          }
        }

        // Last resort: store in memory only
        this.fallbackStorage.set(key, 'memory');
        if (this.options.enableWarnings) {
          console.warn(`Data stored in memory only - will not persist across sessions`);
        }
        return false;
      }
    }

    // Try localStorage first
    try {
      const serializedData = JSON.stringify(dataToStore);
      localStorage.setItem(key, serializedData);

      // Remove from fallback if it was there
      this.fallbackStorage.delete(key);

      const stats = this.getStorageStats();
      if (stats.warning && this.options.enableWarnings) {
        console.warn(`Storage usage: ${(stats.percentage).toFixed(1)}% (${(stats.used / 1024 / 1024).toFixed(2)}MB / ${(stats.quota / 1024 / 1024).toFixed(2)}MB)`);
      }

      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Fall back to sessionStorage
        try {
          sessionStorage.setItem(key, JSON.stringify(dataToStore));
          this.fallbackStorage.set(key, 'session');
          if (this.options.enableWarnings) {
            console.warn(`Data stored in sessionStorage due to localStorage quota exceeded`);
          }
          return true;
        } catch (sessionError) {
          // Fall back to IndexedDB
          if (isIndexedDBSupported()) {
            try {
              await indexedDBStorage.setItem(key, JSON.stringify(dataToStore));
              this.fallbackStorage.set(key, 'indexeddb');
              if (this.options.enableWarnings) {
                console.warn(`Data stored in IndexedDB due to storage quota limits`);
              }
              return true;
            } catch (indexedDBError) {
              console.error('Failed to store in IndexedDB:', indexedDBError);
            }
          }

          // Store in memory
          this.fallbackStorage.set(key, 'memory');
          if (this.options.enableWarnings) {
            console.warn(`Data stored in memory only - will not persist across sessions`);
          }
          return false;
        }
      } else {
        console.error('Failed to store data:', error);
        return false;
      }
    }
  }

  /**
   * Retrieve data with fallbacks
   */
  async getItem(key: string): Promise<any | null> {
    if (typeof window === 'undefined') return null;

    const fallbackType = this.fallbackStorage.get(key);

    try {
      // Check localStorage first
      const localData = localStorage.getItem(key);
      if (localData) {
        return JSON.parse(localData);
      }

      // Check sessionStorage
      const sessionData = sessionStorage.getItem(key);
      if (sessionData) {
        if (this.options.enableWarnings) {
          console.warn(`Data retrieved from sessionStorage`);
        }
        return JSON.parse(sessionData);
      }

      // Check IndexedDB
      if (isIndexedDBSupported()) {
        const indexedDBData = await indexedDBStorage.getItem(key);
        if (indexedDBData) {
          if (this.options.enableWarnings) {
            console.warn(`Data retrieved from IndexedDB`);
          }
          return JSON.parse(indexedDBData);
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return null;
    }
  }

  /**
   * Remove data from all storage locations
   */
  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      if (isIndexedDBSupported()) {
        await indexedDBStorage.removeItem(key);
      }
      this.fallbackStorage.delete(key);
    } catch (error) {
      console.error('Failed to remove data:', error);
    }
  }

  /**
   * Get storage information
   */
  getStorageInfo(): StorageStats & { fallbackUsed: string[] } {
    const stats = this.getStorageStats();
    const fallbackUsed = Array.from(this.fallbackStorage.entries())
      .filter(([_, type]) => type !== 'memory')
      .map(([key, _]) => key);

    return {
      ...stats,
      fallbackUsed
    };
  }
}

// Export singleton instance
export const safeStorage = new SafeStorage();

// Export class for custom configurations
export { SafeStorage };
