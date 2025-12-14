export const colors = {
  brand: '#FF6F00',
  brand2: '#E9A100',
  accent: '#2B8A4B',
  bg: '#FFF8F0',
  surface: '#FFFFFF',
  text: '#2C2C2C',
  muted: '#DDC9B5',
  danger: '#D32F2F',
};

import { Platform } from 'react-native';

// Use your computer's IP address for mobile devices
// For iOS Simulator, you can use localhost, but for physical devices use your IP
const getAPIBaseURL = () => {
  if (__DEV__) {
    // For web, use localhost
    if (Platform.OS === 'web') {
      return 'http://localhost:3000';
    }
    // For iOS Simulator, localhost works
    // For physical devices, use your IP address
    // Change this to your actual IP: 192.168.1.3
    return 'http://192.168.1.3:3000';
  }
  // Production URL (update when you deploy)
  return 'http://localhost:3000';
};

export const API_BASE_URL = getAPIBaseURL();