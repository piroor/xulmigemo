import Base from './base.js';

class Cache extends Base {
  constructor() {
    super();
    this.memCache = new Map();
    this.initialized = false;
    this.dbName = 'MigemoCache';
    this.storeName = 'cache';
  }

  init() {
    return new Promise((resolve, _reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = (event) => {
        console.error('Cache: IndexedDB error', event);
        resolve(false);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const objectStore = db.createObjectStore(this.storeName, { keyPath: 'key' });
        // key: Roman input + type
        // value: RegExp string
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.load().then(() => {
          this.initialized = true;
          resolve(true);
        });
      };
    });
  }

  getCacheFor(aRoman, aTargetDic) {
    // Synchronous return from memory
    aTargetDic = aTargetDic || this.ALL_DIC;
    const key = this._makeKey(aRoman, aTargetDic);
    return this.memCache.get(key) || '';
  }

  clearCacheForAllPatterns(aRoman, _aTargetDic) {
    const patterns = [];
    for (let i = aRoman.length - 1; i > 0; i--) {
      const key = aRoman.substring(0, i);
      patterns.push(key);
      this.clearCacheSilentlyFor(key);
    }
    // In original code, save() was called here. 
    // We are auto-saving on set/clear, so no explicit save needed usually, 
    // but since we are deleting, we should ensure DB is updated.
  }

  clearCacheFor(aRoman) {
    this.clearCacheSilentlyFor(aRoman);
  }

  clearCacheSilentlyFor(aRoman) {
    [this.USER_DIC, this.ALL_DIC].forEach(function(aType) {
      const key = this._makeKey(aRoman, aType);
      if (this.memCache.has(key)) {
        this.memCache.delete(key);
        this._deleteFromDB(key);
      }
    }, this);
  }

  clearAll(aDisk, aTargetDic) {
    // Ignoring aDisk, always clearing both.
    if (aTargetDic) {
      // This is inefficient if we only want to clear one dictionary type 
      // because our keys are mixed. But usually we clear all.
      for (const key of this.memCache.keys()) {
        if (key.endsWith(':' + aTargetDic)) {
          this.memCache.delete(key);
          this._deleteFromDB(key);
        }
      }
    }
    else {
      this.memCache.clear();
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      objectStore.clear();
    }
  }

  setMemCache(aRoman, aRegExp, aTargetDic) {
    // Original logic: setMemCache doesn't save to Disk?
    // In XUL, there was setMemCache and setDiskCache. setDiskCache saved to file.
    // Here, we treat IndexedDB as "Disk". 
    // If only setMemCache is called, we should ideally ONLY update Map.
    // ALLOWING that behavior:
    aTargetDic = aTargetDic || this.ALL_DIC;
    const key = this._makeKey(aRoman, aTargetDic);
    this.memCache.set(key, aRegExp);
  }

  setDiskCache(aRoman, aMyRegExp, aTargetDic) {
    aTargetDic = aTargetDic || this.ALL_DIC;
    // setDiskCache also updates memCache in original code by implication of typical usage,
    // but let's be explicit.
    this.setMemCache(aRoman, aMyRegExp, aTargetDic);

    const key = this._makeKey(aRoman, aTargetDic);
    this._putToDB(key, aMyRegExp);
  }

  _makeKey(roman, dicType) {
    return roman + ':' + dicType;
  }

  _putToDB(key, value) {
    if (!this.db) return;
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const objectStore = transaction.objectStore(this.storeName);
    objectStore.put({ key: key, value: value });
  }

  _deleteFromDB(key) {
    if (!this.db) return;
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const objectStore = transaction.objectStore(this.storeName);
    objectStore.delete(key);
  }

  load() {
    return new Promise((resolve, _reject) => {
      if (!this.db) {
        resolve();
        return;
      }
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          this.memCache.set(cursor.value.key, cursor.value.value);
          cursor.continue();
        }
        else {
          resolve();
        }
      };
      request.onerror = () => {
        resolve(); // resolve anyway
      };
    });
  }
}

const CacheFactory = {
  _instances: {},
  get:        function(aKey) {
    if (!this._instances[aKey]) {
      this._instances[aKey] = new Cache();
      // We delay init? Or should we await?
      // MigemoCache is synchronous in usage. 
      // We must ensure 'init()' is called before usage. 
      // The Core.init will handle this.
      this._instances[aKey].init();
    }
    return this._instances[aKey];
  }
};

export { Cache, CacheFactory };
export default Cache;
