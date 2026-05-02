/**
 * File: react/project/app/_layout.tsx
 * Author: Frank Seely (fseely@bu.edu), 4/27/2026
 * Description: Root app layout with navigation stack and shared providers for the Expo Router app.
 */


import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

function attachWebIosAppFeel() {
  if (typeof document === 'undefined') return;

  const ensureMetaViewport = () => {
    const content =
      'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no';

    let el = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', 'viewport');
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  /** Extra guardrails for pinch/double-tap zoom on Safari */
  const ensureGlobalTouchCss = () => {
    const id = 'financial-tracker-web-touch-css';
    if (document.getElementById(id)) return;

    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      html, body {
        touch-action: manipulation;
      }

      textarea, select, input {
        font-size: 16px !important;
      }
    `;
    document.head.appendChild(style);
  };

  ensureMetaViewport();
  ensureGlobalTouchCss();
}

export const unstable_settings = {
  anchor: '(tabs)',
};

/** sets app-level theme provider and root navigation stack */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (Platform.OS === 'web') {
      attachWebIosAppFeel();
    }
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" /> 
    </ThemeProvider>
  );
}
