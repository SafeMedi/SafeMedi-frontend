import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import * as Sentry from "@sentry/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { TamaguiProvider } from "tamagui";

import { ProfileSync } from "@/components/ProfileSync";
import { PushNotificationSync } from "@/components/PushNotificationSync";
import { palette } from "@/constants/design-tokens";
import { tamaguiConfig } from "../tamagui.config";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_APP_ENV ?? (__DEV__ ? "development" : "production"),
  tracesSampleRate: 1.0,
  integrations: [Sentry.expoRouterIntegration()],
  enableAutoSessionTracking: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

const navigationLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: palette.tint,
    background: palette.background,
    card: palette.background,
    text: palette.text,
    border: palette.icon,
    notification: palette.tint,
  },
};

export const unstable_settings = {
  anchor: "index",
};

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileSync />
      <PushNotificationSync />
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <ThemeProvider value={navigationLight}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(detail)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      </TamaguiProvider>
    </QueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
