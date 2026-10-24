import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Default host based on platform
const getDefaultHost = (): string => {
  // If running via Expo Go on physical device or emulator, hostUri has the computer's network IP (e.g. 10.80.241.173:8081)
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any)?.manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000`;
    }
  }

  // If running in browser on mobile device or remote computer
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:5000`;
    }
  }

  if (Platform.OS === 'android') {
    // Android emulator loopback to host PC
    return 'http://10.0.2.2:5000';
  }
  // Web or iOS Simulator localhost
  return 'http://localhost:5000';
};

let currentApiUrl = getDefaultHost();

export const getApiBaseUrl = (): string => {
  return currentApiUrl;
};

export const setApiBaseUrl = (newUrl: string): void => {
  // Ensure no trailing slash
  currentApiUrl = newUrl.replace(/\/+$/, '');
};

export const getFullMediaUrl = (relativeUrl?: string | null): string | null => {
  if (!relativeUrl) return null;
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  return `${getApiBaseUrl()}${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
};
