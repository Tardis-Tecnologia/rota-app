import WelcomeSplash, { type WelcomeSplashMode } from '@/components/WelcomeSplash';
import { useAuth } from '@/contexts/AuthContext';
import { useWhitelabelCity } from '@/hooks/useWhitelabelCity';
import { hasLoggedInBefore } from '@/services/welcomeAccessStore';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const MIN_SPLASH_MS = 1600;

/**
 * Loading rápido antes da tela de login / home:
 * - primeiro acesso → "Bem-vindo a {cidade} Digital"
 * - já teve conta neste aparelho (ou sessão restaurada) → "Bem-vindo de volta…"
 */
export default function WelcomeGate({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useAuth();
  const city = useWhitelabelCity();
  const [mode, setMode] = useState<WelcomeSplashMode | null>(null);
  const [ready, setReady] = useState(false);
  const [minTimeDone, setMinTimeDone] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const returning = await hasLoggedInBefore();
      if (!alive) return;
      setMode(returning ? 'returning' : 'first');
    })();
    const timer = setTimeout(() => {
      if (alive) setMinTimeDone(true);
    }, MIN_SPLASH_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (user && mode === 'first') {
      setMode('returning');
    }
  }, [mode, user]);

  useEffect(() => {
    if (ready) return;
    if (mode == null) return;
    if (!minTimeDone) return;
    if (isLoading) return;
    setReady(true);
  }, [isLoading, minTimeDone, mode, ready]);

  const showSplash = !ready && mode != null;

  return (
    <View style={styles.root}>
      {children}
      {showSplash ? <WelcomeSplash mode={mode} cityName={city.cityName} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
