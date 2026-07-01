import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { TamaguiProvider } from "tamagui";

import { ProfileSync } from "@/components/ProfileSync";
import { PushNotificationSync } from "@/components/PushNotificationSync";
import { palette } from "@/constants/design-tokens";
import { tamaguiConfig } from "../tamagui.config";

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

export default function RootLayout() {
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
