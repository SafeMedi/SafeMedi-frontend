import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { queryKeys } from "@/api/query-keys";
import { useSessionStore } from "@/stores/sessionStore";
import { useUserStore } from "@/stores/userStore";

const AUTH_SCOPED_QUERY_KEY_PREFIXES = [
  queryKeys.user.me,
  ["dashboard"],
  ["family"],
  ["profile"],
  ["prescriptions"],
  ["scan"],
  ["map"],
] as const;

export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useSessionStore((s) => s.clearSession);
  const clearUser = useUserStore((s) => s.clearUser);

  return useCallback(() => {
    clearSession();
    clearUser();
    for (const queryKey of AUTH_SCOPED_QUERY_KEY_PREFIXES) {
      queryClient.removeQueries({ queryKey });
    }
  }, [clearSession, clearUser, queryClient]);
}
