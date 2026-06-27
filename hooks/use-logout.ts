import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { queryKeys } from "@/api/query-keys";
import { useSessionStore } from "@/stores/sessionStore";
import { useUserStore } from "@/stores/userStore";

export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useSessionStore((s) => s.clearSession);
  const clearUser = useUserStore((s) => s.clearUser);

  return useCallback(() => {
    clearSession();
    clearUser();
    queryClient.removeQueries({ queryKey: queryKeys.user.me });
    queryClient.removeQueries({ queryKey: queryKeys.profile.families });
    queryClient.removeQueries({ queryKey: queryKeys.profile.notificationSettings });
  }, [clearSession, clearUser, queryClient]);
}
