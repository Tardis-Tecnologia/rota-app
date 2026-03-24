import { useAppTheme } from '@/contexts/AppThemeContext';
import { usePathname } from 'expo-router';
import { useEffect } from 'react';

export function ThemeSyncOnNavigation() {
  const pathname = usePathname();
  const { syncThemeOnNavigation } = useAppTheme();

  useEffect(() => {
    void syncThemeOnNavigation();
  }, [pathname, syncThemeOnNavigation]);

  return null;
}
