// IndexedDB for offline support
const LocalDB = {
  dbName: 'HabitTrackerDB',
  dbVersion: 1,
  db: null,
  
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Habits store
        if (!db.objectStoreNames.contains('habits')) {
          const habitsStore = db.createObjectStore('habits', { keyPath: 'id' });
          habitsStore.createIndex('user_id', 'user_id', { unique: false });
        }
        
        // Completions store
        if (!db.objectStoreNames.contains('completions')) {
          const completionsStore = db.createObjectStore('completions', { keyPath: 'id' });
          completionsStore.createIndex('habit_id', 'habit_id', { unique: false });
          completionsStore.createIndex('user_id', 'user_id', { unique: false });
          completionsStore.createIndex('date', 'date', { unique: false });
          completionsStore.createIndex('habit_date', ['habit_id', 'date'], { unique: true });
        }
        
        // Achievements store
        if (!db.objectStoreNames.contains('achievements')) {
          const achievementsStore = db.createObjectStore('achievements', { keyPath: 'id' });
          achievementsStore.createIndex('user_id', 'user_id', { unique: false });
        }
        
        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  },
  
  async getAll(storeName, indexName, indexValue) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request;
      if (indexName && indexValue !== undefined) {
        const index = store.index(indexName);
        request = index.getAll(indexValue);
      } else {
        request = store.getAll();
      }
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  // Add to sync queue
  async addToSyncQueue(operation) {
    return this.put('syncQueue', {
      ...operation,
      timestamp: new Date().toISOString(),
      synced: false
    });
  },
  
  // Get pending sync operations
  async getPendingSyncOperations() {
    return this.getAll('syncQueue', 'synced', false);
  },
  
  // Mark as synced
  async markAsSynced(id) {
    const item = await this.get('syncQueue', id);
    if (item) {
      item.synced = true;
      await this.put('syncQueue', item);
    }
  }
};

// Initialize IndexedDB on load
LocalDB.init().catch(console.error);
