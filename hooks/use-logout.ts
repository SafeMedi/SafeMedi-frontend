import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { deleteDeviceToken } from "@/api/endpoints/device-token";
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
  const clearSession = useSessionStore((s) => s.clearSession);
  const clearUser = useUserStore((s) => s.clearUser);

  return useCallback(async () => {
    const deviceToken = getRegisteredDeviceToken();
    if (deviceToken) {
      try {
        await deleteDeviceToken({ deviceToken });
      } catch {
        // 토큰 해제 실패는 로그아웃 진행을 막지 않음
      }
      clearRegisteredDeviceToken();
    }

    clearSession();
    clearUser();
    for (const queryKey of AUTH_SCOPED_QUERY_KEY_PREFIXES) {
      queryClient.removeQueries({ queryKey });
    }
  }, [clearSession, clearUser, queryClient]);
}
