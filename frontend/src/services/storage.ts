import { Platform } from 'react-native';

const memoryStore: Record<string, string> = {};

/**
 * Test whether localStorage is actually usable (not just defined).
 * Safari in private mode exposes window.localStorage but throws on write.
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__miniledger_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const useLocalStorage =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  typeof window.localStorage !== 'undefined' &&
  isLocalStorageAvailable();

if (Platform.OS === 'web' && !useLocalStorage) {
  console.warn(
    '[Storage] localStorage is unavailable (private/incognito mode or browser restriction). ' +
    'Data will be stored in-memory only and WILL BE LOST when the tab is closed. ' +
    'Open in a normal (non-private) browser tab for persistent storage.'
  );
}

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (useLocalStorage) {
        return window.localStorage.getItem(key);
      }
      if (Platform.OS !== 'web') {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        return await AsyncStorage.getItem(key);
      }
    } catch (err) {
      console.warn('[Storage] getItem failed, using memory fallback:', err);
    }
    return memoryStore[key] ?? null;
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (useLocalStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      if (Platform.OS !== 'web') {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(key, value);
        return;
      }
    } catch (err) {
      console.warn('[Storage] setItem failed, using memory fallback:', err);
    }
    memoryStore[key] = value;
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (useLocalStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      if (Platform.OS !== 'web') {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem(key);
        return;
      }
    } catch (err) {
      console.warn('[Storage] removeItem failed, using memory fallback:', err);
    }
    delete memoryStore[key];
  },
};
