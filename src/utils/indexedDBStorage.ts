/**
 * IndexedDB Storage Utility
 * Handles storage of large files (up to 50MB+) that exceed localStorage limits
 */

const DB_NAME = 'StudyAI_FileStorage';
const DB_VERSION = 1;
const STORE_NAME = 'materials';

interface StoredMaterial {
  id: string;
  content: string;
  timestamp: number;
}

class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB: Failed to open database', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB: Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('IndexedDB: Object store created');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Store material content in IndexedDB
   */
  async setItem(id: string, content: string): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const data: StoredMaterial = {
        id,
        content,
        timestamp: Date.now()
      };

      const request = store.put(data);

      request.onsuccess = () => {
        console.log(`IndexedDB: Stored material ${id}, size: ${(content.length / 1024 / 1024).toFixed(2)}MB`);
        resolve();
      };

      request.onerror = () => {
        console.error(`IndexedDB: Failed to store material ${id}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Retrieve material content from IndexedDB
   */
  async getItem(id: string): Promise<string | null> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as StoredMaterial | undefined;
        if (result) {
          console.log(`IndexedDB: Retrieved material ${id}, size: ${(result.content.length / 1024 / 1024).toFixed(2)}MB`);
          resolve(result.content);
        } else {
          console.log(`IndexedDB: Material ${id} not found`);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error(`IndexedDB: Failed to retrieve material ${id}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove material content from IndexedDB
   */
  async removeItem(id: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`IndexedDB: Removed material ${id}`);
        resolve();
      };

      request.onerror = () => {
        console.error(`IndexedDB: Failed to remove material ${id}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all stored material IDs
   */
  async getAllKeys(): Promise<string[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result as string[]);
      };

      request.onerror = () => {
        console.error('IndexedDB: Failed to get all keys', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all stored materials
   */
  async clear(): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('IndexedDB: All materials cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('IndexedDB: Failed to clear materials', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{ count: number; estimatedSize: number }> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const materials = request.result as StoredMaterial[];
        const count = materials.length;
        const estimatedSize = materials.reduce((total, material) => {
          return total + material.content.length;
        }, 0);

        resolve({ count, estimatedSize });
      };

      request.onerror = () => {
        console.error('IndexedDB: Failed to get storage stats', request.error);
        reject(request.error);
      };
    });
  }
}

// Export singleton instance
export const indexedDBStorage = new IndexedDBStorage();

// Helper function to check if IndexedDB is supported
export const isIndexedDBSupported = (): boolean => {
  return typeof indexedDB !== 'undefined';
};

// Helper function to format bytes
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
