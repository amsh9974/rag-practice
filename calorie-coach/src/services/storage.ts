/**
 * Minimal key-value storage abstraction so services (entitlements,
 * profile persistence, diary cache) don't depend directly on React
 * Native. InMemoryStorage is used in Jest tests; AsyncStorageAdapter
 * wraps @react-native-async-storage/async-storage for the running app.
 *
 * This is local device storage only — suitable for offline-first UI
 * state, not a substitute for a real backend. Section 22 (privacy &
 * security) requires the production version to sync profile/diary data
 * to an encrypted backend rather than relying on on-device storage alone.
 */

export interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class InMemoryStorage implements Storage {
  private store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

/**
 * Lazily requires AsyncStorage so this module can still be imported from
 * plain Node (Jest) without the native package installed/linked.
 */
export class AsyncStorageAdapter implements Storage {
  private asyncStorage: Storage | null = null;

  private async getBackend(): Promise<Storage> {
    if (!this.asyncStorage) {
      const mod = await import("@react-native-async-storage/async-storage");
      this.asyncStorage = mod.default as unknown as Storage;
    }
    return this.asyncStorage;
  }

  async getItem(key: string): Promise<string | null> {
    return (await this.getBackend()).getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    return (await this.getBackend()).setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    return (await this.getBackend()).removeItem(key);
  }
}
