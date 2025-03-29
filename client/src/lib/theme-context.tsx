import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if theme is stored in local storage
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      return savedTheme;
    }
    
    // If no saved theme, determine based on time
    const hours = new Date().getHours();
    return hours >= 6 && hours < 18 ? 'light' : 'dark';
  });

  useEffect(() => {
    // Save theme to local storage when it changes
    localStorage.setItem('theme', theme);
    
    // Apply theme class to the document body
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  // Check time every minute to auto-switch theme if needed
  useEffect(() => {
    const checkTime = () => {
      const hours = new Date().getHours();
      const autoTheme = hours >= 6 && hours < 18 ? 'light' : 'dark';
      
      // Only change theme if auto mode is enabled
      // Auto mode is detected by seeing if the theme matches what would be auto-selected
      const previousTime = new Date();
      previousTime.setMinutes(previousTime.getMinutes() - 1);
      const previousHours = previousTime.getHours();
      const previousAutoTheme = previousHours >= 6 && previousHours < 18 ? 'light' : 'dark';
      
      if (previousAutoTheme !== autoTheme && theme === previousAutoTheme) {
        setTheme(autoTheme);
      }
    };
    
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [theme]);

  const value = { theme, setTheme };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}