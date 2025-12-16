import * as SecureStore from 'expo-secure-store';

// Light theme colors
export const lightColors = {
  brand: '#FF6F00',
  brand2: '#E9A100',
  accent: '#2B8A4B',
  bg: '#FFF8F0',
  surface: '#FFFFFF',
  text: '#2C2C2C',
  muted: '#DDC9B5',
  danger: '#D32F2F',
};

// Dark theme colors - matching the provided design tokens
export const darkColors = {
  brand: '#FF8A2B', // Primary CTA / Full tiffin
  brand2: '#F5C45B', // Secondary CTA / Half tiffin
  accent: '#50B26C', // Rice-only or success
  bg: '#0B0E0F', // Deep neutral background
  surface: '#1A1F1E', // Primary surface (cards) - lightened for better visibility
  text: '#E6F0EF', // Body text on dark
  muted: '#8A9995', // Muted text
  danger: '#EF5C5C', // Errors / cancels
};

// Default to light theme
export const colors = lightColors;

// Theme storage key
const THEME_STORAGE_KEY = 'app_theme';

// Get API Base URL
const getAPIBaseURL = () => {
  // Temporarily force production URL for testing
  // return 'https://tiffin-backend-zo3a.onrender.com';
  return 'http://192.168.1.9:3000';
  // Original code...
};

export const API_BASE_URL = getAPIBaseURL();

// Theme management functions
export const getStoredTheme = async (): Promise<'light' | 'dark'> => {
  try {
    const theme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
    return (theme as 'light' | 'dark') || 'light';
  } catch (error) {
    console.error('Error getting stored theme:', error);
    return 'light';
  }
};

export const storeTheme = async (theme: 'light' | 'dark'): Promise<void> => {
  try {
    await SecureStore.setItemAsync(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Error storing theme:', error);
  }
};
