import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useUserProfile } from "@/api/queries/user";
import { useSessionHydrated } from "@/hooks/use-session-hydrated";
import { useSessionStore } from "@/stores/sessionStore";

export default function IndexRedirect() {
  const hydrated = useSessionHydrated();
  const accessToken = useSessionStore((s) => s.accessToken);
  const { data: profile, isPending, isError } = useUserProfile();

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!accessToken) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isPending) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError || !profile) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!profile.isTutorialCompleted) {
    return <Redirect href="/(auth)/tutorial" />;
  }

  return <Redirect href="/(tabs)/dashboard" />;
}
