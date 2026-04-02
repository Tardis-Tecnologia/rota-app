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
  primaryDark: '#004499', // Azul escuro para bordas
  primaryLight: '#0891b2', // cyan-600
  accent: '#06b6d4', // corresponde à var(--color-cyan-500) em css/global.css
  
  // Cores de Texto
  text: {
    primary: '#11181C',
    secondary: '#333',
    tertiary: '#666',
    quaternary: '#999',
    white: '#fff',
    dark: '#ECEDEE',
    yellow: '#F7BC26',
    gray: '#A5ACB7'
  },
  
  // Cores de Fundo
  background: {
    default: '#fff',
    light: '#f5f5f5',
    dark: '#151718',
    overlay: 'rgba(255, 255, 255, 0.8)',
    overlayStrong: 'rgba(15, 23, 42, 0.7)',
    overlayPressed: 'rgba(226, 232, 240, 0.6)',
    glass: 'rgba(255, 255, 255, 0.94)',
    input: '#e2e8f0',
    muted: '#F8FAFC',
    blue: '#3C3895',
    lightBlue: '#4F46E5',
    darkBlue: '#0F172A',
    purple: '#584569',
    backgroundDanger: 'rgba(231, 76, 60, 0.08)',
    borderDanger: 'rgba(231, 76, 60, 0.2)',

  },

  palette: {
    amber: {
      light: '#fef3c7',
      base: '#f59e0b',
    },
    sky: {
      light: '#e0f2fe',
      base: '#0284c7',
    },
    indigo: {
      light: '#e0e7ff',
      base: '#6366f1',
    },
    purple: {
      base: 'rgb(147, 51, 234)',
    },
    teal: {
      light: '#ccfbf1',
      base: '#0d9488',
    },
    orange: {
      base: '#f97316',
    },
  },
  
  // Cores para Poll/Enquete
  poll: {
    gradientStart: '#667eea',
    gradientEnd: '#764ba2',
    optionBg: 'rgba(255, 255, 255, 0.15)',
    optionBgSelected: 'rgba(255, 255, 255, 1)',
    text: '#ffffff',
    border: 'rgba(255, 255, 255, 0.2)',
    borderSelected: 'rgba(255, 255, 255, 0.5)',
  },
  
  // Cores para Report Button
  report: {
    orange: '#f97316',
    red: '#ef4444',
    amber: '#f59e0b',
    gray: '#6b7280',
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

  translucent: {
    white40: 'rgba(255, 255, 255, 0.4)',
  },
  
  // Cores de Ícones
  icon: {
    default: '#687076',
    selected: '#0066CC',
    dark: '#9BA1A6',
  },
  
  // Cores do WhatsApp
  whatsapp: '#25D366',

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

  notification: {
    alert: {
      background: '#fef3c7',
      icon: '#d97706',
    },
    job: {
      background: '#ccfbf1',
      icon: '#0d9488',
    },
    education: {
      background: '#e0e7ff',
      icon: '#4f46e5',
    },
  },

  gradients: {
    services: {
      transport: ['#3B82F6', '#22D3EE'] as [string, string],
      health: ['#EF4444', '#FB923C'] as [string, string],
      education: ['#8B5CF6', '#6366F1'] as [string, string],
      jobs: ['#14B8A6', '#4ADE80'] as [string, string],
      servicesPro: ['#6d28d9', '#7e22ce'] as [string, string],
      security: ['#3B82F8', '#22D3EE'] as [string, string],
      marketplace: ['#f59e0b', '#f97316'] as [string, string],
      culture: ['#EC4899', '#D946EF'] as [string, string],
      tourism: ['#0EA5E9', '#3B82F6'] as [string, string],
      citizenship: ['#F59E0B', '#FACC15'] as [string, string],
      animals: ['#22C55E', '#10B981'] as [string, string],
      workInProgess: ['#c2410c', '#b45309 '] as [string, string],
      resolvedProblems: ['#0891b2 ', '#14b8a6 '] as [string, string],
      municipalContact: ['#1d4ed8 ', '#4338ca '] as [string, string],
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

function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim();
  const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(normalized);
  if (!match) return null;
  const h = match[1];
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * Escurece um `#rgb` ou `#rrggbb` misturando em direção ao preto (0 = inalterado, 1 = preto).
 * Útil para gradientes a partir da cor de marca da API.
 */
export function shadeHexColor(hex: string, amount: number): string {
  const rgb = parseHexRgb(hex);
  if (!rgb) return hex.trim();
  const blend = (c: number) => Math.round(c * (1 - amount));
  const toHex = (c: number) => blend(c).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/** Converte `#rgb` / `#rrggbb` em `rgba(...)` com alpha entre 0 e 1. */
export function hexToRgba(hex: string, alpha: number): string {
  const rgb = parseHexRgb(hex);
  if (!rgb) return `rgba(0,0,0,${alpha})`;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

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
