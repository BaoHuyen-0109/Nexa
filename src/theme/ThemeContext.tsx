import React, { createContext, useContext, useState, ReactNode } from 'react';
import { colors as defaultColors, ColorPalette } from './colors';
import { typography, fontSizes, fontWeights } from './typography';
import { spacing, borderRadius } from './spacing';
import { AppTheme } from './theme';

export type ThemePreset = 'neutral' | 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo';

export const themePresets: Record<ThemePreset, Partial<ColorPalette>> = {
  neutral: {
    primary: '#27272A',
    primaryLight: '#F4F4F5',
    onPrimary: '#FFFFFF',
    secondary: '#52525B',
    secondaryLight: '#E4E4E7',
  },
  blue: {
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
    onPrimary: '#FFFFFF',
    secondary: '#3B82F6',
    secondaryLight: '#DBEAFE',
  },
  emerald: {
    primary: '#059669',
    primaryLight: '#ECFDF5',
    onPrimary: '#FFFFFF',
    secondary: '#10B981',
    secondaryLight: '#D1FAE5',
  },
  amber: {
    primary: '#D97706',
    primaryLight: '#FFFBEB',
    onPrimary: '#FFFFFF',
    secondary: '#F59E0B',
    secondaryLight: '#FEF3C7',
  },
  rose: {
    primary: '#E11D48',
    primaryLight: '#FFF1F2',
    onPrimary: '#FFFFFF',
    secondary: '#F43F5E',
    secondaryLight: '#FFE4E6',
  },
  indigo: {
    primary: '#4F46E5',
    primaryLight: '#EEF2FF',
    onPrimary: '#FFFFFF',
    secondary: '#6366F1',
    secondaryLight: '#E0E7FF',
  },
};

interface ThemeContextType {
  theme: AppTheme;
  currentPreset: ThemePreset;
  setThemePreset: (preset: ThemePreset) => void;
  updateCustomColors: (customColors: Partial<ColorPalette>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentColors, setCurrentColors] = useState<ColorPalette>(defaultColors);
  const [currentPreset, setCurrentPreset] = useState<ThemePreset>('neutral');

  const setThemePreset = (preset: ThemePreset) => {
    setCurrentPreset(preset);
    setCurrentColors((prev) => ({
      ...prev,
      ...themePresets[preset],
    }));
  };

  const updateCustomColors = (customColors: Partial<ColorPalette>) => {
    setCurrentColors((prev) => ({
      ...prev,
      ...customColors,
    }));
  };

  const theme: AppTheme = {
    colors: currentColors,
    spacing,
    borderRadius,
    fontSizes,
    fontWeights,
    typography,
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        currentPreset,
        setThemePreset,
        updateCustomColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useAppTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback nếu không bọc ThemeProvider
    return {
      theme: {
        colors: defaultColors,
        spacing,
        borderRadius,
        fontSizes,
        fontWeights,
        typography,
      },
      currentPreset: 'neutral',
      setThemePreset: () => {},
      updateCustomColors: () => {},
    };
  }
  return context;
}
