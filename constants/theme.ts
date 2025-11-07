/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 * 
 * Todas as cores do projeto estão centralizadas aqui para facilitar manutenção e consistência.
 * Consulte também: css/global.css para variáveis CSS equivalentes.
 */

import { Platform } from 'react-native';

// Cores da Prefeitura de Maricá
const tintColorLight = '#0066CC';
const tintColorDark = '#4DA6FF';

/**
 * Paleta de cores completa do aplicativo
 */
export const AppColors = {
  // Cores Primárias
  primary: '#0066CC',
  primaryDark: '#4DA6FF',
  primaryLight: '#0891b2', // cyan-600
  
  // Cores de Texto
  text: {
    primary: '#11181C',
    secondary: '#333',
    tertiary: '#666',
    quaternary: '#999',
    white: '#fff',
    dark: '#ECEDEE',
  },
  
  // Cores de Fundo
  background: {
    default: '#fff',
    light: '#f5f5f5',
    dark: '#151718',
    overlay: 'rgba(255, 255, 255, 0.8)',
    muted: '#F8FAFC',
  },
  
  // Cores Neutras (Escala de Cinza)
  gray: {
    100: '#f5f5f5',
    200: '#eee',
    300: '#ddd',
    400: '#ccc',
    500: '#6b7280',
    600: '#666',
    700: '#333',
    800: '#11181C',
    900: '#000',
  },
  
  // Cores de Status
  status: {
    success: '#27AE60',
    error: '#E74C3C',
    warning: '#F39C12',
    info: '#3498DB',
  },
  
  // Cores de Categorias - Pontos de Interesse
  categoria: {
    governo: '#0066CC',
    saude: '#E74C3C',
    lazer: '#27AE60',
    educacao: '#3498DB',
    cultura: '#9B59B6',
    turismo: '#1ABC9C',
    esporte: '#F39C12',
    meioAmbiente: '#27AE60',
  },
  
  // Cores da Tab Bar
  tab: {
    active: '#0891b2', // cyan-600
    inactive: '#6b7280', // gray-500
    background: 'rgba(255, 255, 255, 0.8)',
    border: 'rgba(229, 231, 235, 0.8)', // gray-200/80
  },
  
  // Cores de Sombra
  shadow: '#000',
  
  // Cores de Ícones
  icon: {
    default: '#687076',
    selected: '#0066CC',
    dark: '#9BA1A6',
  },

  // Cores de Borda
  border: {
    muted: 'rgba(148, 163, 184, 0.4)',
  },

  // Cores específicas de seções
  feed: {
    filterBackground: '#FFFFFF',
    filterButton: '#F8FAFC',
    filterActive: '#0891b2',
    filterText: '#1F2937',
  },

  alerts: {
    primary: '#fbbf24',
    secondary: '#f97316',
  },

  gradients: {
    services: {
      transport: ['#3B82F6', '#22D3EE'] as [string, string],
      health: ['#EF4444', '#FB923C'] as [string, string],
      education: ['#8B5CF6', '#6366F1'] as [string, string],
      jobs: ['#14B8A6', '#4ADE80'] as [string, string],
      culture: ['#EC4899', '#D946EF'] as [string, string],
      tourism: ['#0EA5E9', '#3B82F6'] as [string, string],
      citizenship: ['#F59E0B', '#FACC15'] as [string, string],
      animals: ['#22C55E', '#10B981'] as [string, string],
    },
  },
};

/**
 * Cores do tema (light/dark) - mantido para compatibilidade
 */
export const Colors = {
  light: {
    text: AppColors.text.primary,
    background: AppColors.background.default,
    tint: tintColorLight,
    icon: AppColors.icon.default,
    tabIconDefault: AppColors.icon.default,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: AppColors.text.dark,
    background: AppColors.background.dark,
    tint: tintColorDark,
    icon: AppColors.icon.dark,
    tabIconDefault: AppColors.icon.dark,
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
