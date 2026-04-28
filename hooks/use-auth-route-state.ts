import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { isUnauthorizedError } from "@/api/error";
import { useUserProfile } from "@/api/queries/user";
import { queryKeys } from "@/api/query-keys";
import { useSessionHydrated } from "@/hooks/use-session-hydrated";
import { useSessionStore } from "@/stores/sessionStore";

export type AuthRouteHref = "/(auth)/login" | "/(auth)/tutorial" | "/(tabs)/dashboard";

type AuthRouteState =
  | { kind: "loading" }
  | { kind: "error"; retry: () => void }
  | { kind: "redirect"; href: AuthRouteHref };

export function useAuthRouteState(): AuthRouteState {
  const queryClient = useQueryClient();
  const hydrated = useSessionHydrated();
  const accessToken = useSessionStore((s) => s.accessToken);
  const clearSession = useSessionStore((s) => s.clearSession);
  const { data: profile, isPending, isError, error, refetch } = useUserProfile();

  useEffect(() => {
    if (!hydrated || !accessToken || !isError || !isUnauthorizedError(error)) {
      return;
    }
    clearSession();
    queryClient.removeQueries({ queryKey: queryKeys.user.me });
  }, [hydrated, accessToken, isError, error, clearSession, queryClient]);

  if (!hydrated) {
    return { kind: "loading" };
  }

  if (!accessToken) {
    return { kind: "redirect", href: "/(auth)/login" };
  }

  if (isPending || (!isError && !profile)) {
    return { kind: "loading" };
  }

  if (isError) {
    if (isUnauthorizedError(error)) {
      return { kind: "loading" };
    }
    return { kind: "error", retry: () => void refetch() };
  }

  if (!profile.isTutorialCompleted) {
    return { kind: "redirect", href: "/(auth)/tutorial" };
  }

  return { kind: "redirect", href: "/(tabs)/dashboard" };
}
