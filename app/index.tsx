import { Redirect } from "expo-router";

import { useUserStore } from "@/stores/userStore";

export default function IndexRedirect() {
  const user = useUserStore((s) => s.user);

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)/dashboard" />;
}
