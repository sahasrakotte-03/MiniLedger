import { Platform } from 'react-native';

// Default host based on platform
const getDefaultHost = (): string => {
  if (Platform.OS === 'android') {
    // Android emulator loopback to host PC
    return 'http://10.0.2.2:5000';
  }
  // Web or iOS Simulator
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
