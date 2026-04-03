import { useRouter } from "expo-router";
import { useEffect } from "react";

import { useUserStore } from "@/stores/userStore";

export default function IndexRedirect() {
  const user = useUserStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    router.replace("/(tabs)/dashboard");
  }, [router, user]);

  return null;
}

