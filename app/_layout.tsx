import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { type ReactNode, useEffect } from "react";
import "react-native-reanimated";
import { TamaguiProvider } from "tamagui";

import { palette } from "@/constants/design-tokens";
import { useUserStore } from "@/stores/userStore";
import { tamaguiConfig } from "../tamagui.config";

const queryClient = new QueryClient();

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

function AuthRedirectBoundary({ children }: { children: ReactNode }) {
  const user = useUserStore((s) => s.user);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const first = segments[0];
    const inAuthGroup = first === "(auth)";

    if (!user) {
      if (!first || first === "(tabs)" || first === "modal") {
        router.replace("/(auth)/login");
      }
      return;
    }
    if (user && inAuthGroup) {
      router.replace("/(tabs)/dashboard");
    }
  }, [user, segments, router]);

  return children;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <ThemeProvider value={navigationLight}>
          <AuthRedirectBoundary>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
            </Stack>
          </AuthRedirectBoundary>
          <StatusBar style="dark" />
        </ThemeProvider>
      </TamaguiProvider>
    </QueryClientProvider>
  );
}
