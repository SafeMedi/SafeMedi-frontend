import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useLogoutMutation } from "@/api/queries/auth";
import { queryKeys } from "@/api/query-keys";
import {
  clearRegisteredDeviceToken,
  getRegisteredDeviceToken,
} from "@/hooks/push-notification-token-store";
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
  ["notification"],
] as const;

export function useLogout() {
  const queryClient = useQueryClient();
  const logoutMutation = useLogoutMutation();
  const clearSession = useSessionStore((s) => s.clearSession);
  const clearUser = useUserStore((s) => s.clearUser);

  return useCallback(async () => {
    const deviceToken = getRegisteredDeviceToken();

    try {
      if (deviceToken) {
        await logoutMutation.mutateAsync({ deviceToken });
      }
    } catch (error) {
      if (__DEV__) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[useLogout] 로그아웃 API 호출 실패: ${message}`);
      }
    } finally {
      if (deviceToken) {
        clearRegisteredDeviceToken();
      }
      clearSession();
      clearUser();
      for (const queryKey of AUTH_SCOPED_QUERY_KEY_PREFIXES) {
        queryClient.removeQueries({ queryKey });
      }
    }
  }, [clearSession, clearUser, logoutMutation, queryClient]);
}
