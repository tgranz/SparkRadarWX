// Theme configuration for light and dark modes
import { useColorScheme } from 'react-native';

// Define color palettes for light and dark themes
export const lightTheme = {
  // Background colors
  gradientStart: '#27BEFF',
  gradientEnd: '#2A7FFF',
  cardBackground: '#FFFFFF',
  sidebarBackground: '#FFFFFF',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  
  // Text colors
  primaryText: '#000000',
  secondaryText: '#666666',
  headerText: '#000000',
  
  // UI element colors
  iconColor: '#000000',
  borderColor: '#F0F0F0',
  searchBackground: '#F5F5F5',
  shadowColor: '#000000',
  
  // Weather-specific colors
  weatherIconPrimary: '#2a7fff',
  
  // Alert colors (same for both themes)
  alertTornado: '#da1990ff',
  alertWarning: '#ff2121',
  alertWatch: '#ff7e00',
  alertAdvisory: '#ffff00',
};

export const darkTheme = {
  // Background colors
  gradientStart: '#1a1a2e',
  gradientEnd: '#16213e',
  cardBackground: '#2d2d2d',
  sidebarBackground: '#2d2d2d',
  backdrop: 'rgba(0, 0, 0, 0.7)',
  
  // Text colors
  primaryText: '#FFFFFF',
  secondaryText: '#AAAAAA',
  headerText: '#FFFFFF',
  
  // UI element colors
  iconColor: '#FFFFFF',
  borderColor: '#444444',
  searchBackground: '#3a3a3a',
  shadowColor: '#000000',
  
  // Weather-specific colors
  weatherIconPrimary: '#5aa3ff',
  
  // Alert colors (same for both themes)
  alertTornado: '#da1990ff',
  alertWarning: '#ff2121',
  alertWatch: '#ff7e00',
  alertAdvisory: '#ffff00',
};

// Custom hook to get the current theme based on color scheme
export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  
  return {
    theme,
    isDark,
    colorScheme,
  };
}

// Export theme colors getter function
export function getThemeColors(isDark) {
  return isDark ? darkTheme : lightTheme;
}
