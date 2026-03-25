import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { TamaguiProvider } from 'tamagui';

import { palette } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { tamaguiConfig } from '../tamagui.config';

const queryClient = new QueryClient();

const navigationLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: palette.light.tint,
    background: palette.light.background,
    card: palette.light.background,
    text: palette.light.text,
    border: palette.light.icon,
    notification: palette.light.tint,
  },
};

const navigationDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: palette.dark.tint,
    background: palette.dark.background,
    card: palette.dark.background,
    text: palette.dark.text,
    border: palette.dark.icon,
    notification: palette.dark.tint,
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={(colorScheme ?? 'light') as 'light' | 'dark'}>
        <ThemeProvider value={colorScheme === 'dark' ? navigationDark : navigationLight}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </TamaguiProvider>
    </QueryClientProvider>
  );
}
