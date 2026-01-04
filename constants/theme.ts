import * as SecureStore from 'expo-secure-store';

export const lightColors = {
  brand: '#F76707',   // deep saffron-orange (rich, cooked-food tone)
  brand2: '#E9B949',  // muted turmeric-gold (not yellowish)
  accent: '#1F9D6E',  // balanced jade green (trust + freshness)

  bg: '#FAFAF9',      // neutral studio white (zero creaminess)
  surface: '#FFFFFF',

  text: '#1C1F24',    // near-black slate (crisp but soft)
  muted: '#8A8178',   // warm-neutral gray (perfect hierarchy)

  danger: '#C63636',  // mature red (professional, not panic)
};



// Dark theme colors - matching the provided design tokens
export const darkColors = {
  brand: '#FF8F2D',   // premium saffron glow (eye-safe)
  brand2: '#F1C453',  // soft gold highlight
  accent: '#2FB67E',  // controlled emerald-green

  bg: '#070809',      // near-absolute AMOLED black
  surface: '#111416', // floating surface depth

  text: '#ECEFF1',    // clean white without glare
  muted: '#A1A7A5',   // neutral gray (no green tint)

  danger: '#E85A5A',  // visible but calm red
};


// Default to light theme
export const colors = lightColors;

// Theme storage key
const THEME_STORAGE_KEY = 'app_theme';

// Get API Base URL 
const getAPIBaseURL = () => {
  // Temporarily force production URL for testing
  // return 'https://tiffin-backend-zo3a.onrender.com';
  return 'http://192.168.1.7:3000';
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
