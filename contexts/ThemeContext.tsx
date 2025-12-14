import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { lightColors, darkColors, getStoredTheme, storeTheme } from '@/constants/theme';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colors: typeof lightColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [colors, setColors] = useState(lightColors);

  useEffect(() => {
    // Load theme from storage on mount
    const loadTheme = async () => {
      const storedTheme = await getStoredTheme();
      setThemeState(storedTheme);
      setColors(storedTheme === 'dark' ? darkColors : lightColors);
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    setColors(newTheme === 'dark' ? darkColors : lightColors);
    await storeTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

