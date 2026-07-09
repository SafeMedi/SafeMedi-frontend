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

export type LogoutOptions = {
  /** 인증 토큰 만료·무효 등으로 서버 디바이스 토큰 해제 API를 호출하지 않습니다. */
  skipDeviceTokenDeletion?: boolean;
};

export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useSessionStore((s) => s.clearSession);
  const clearUser = useUserStore((s) => s.clearUser);

  return useCallback(
    async (options?: LogoutOptions) => {
      const accessToken = useSessionStore.getState().accessToken;
      const deviceToken = getRegisteredDeviceToken();
      const shouldDeleteDeviceTokenOnServer =
        Boolean(deviceToken && accessToken) && !options?.skipDeviceTokenDeletion;

      if (shouldDeleteDeviceTokenOnServer && deviceToken) {
        try {
          await deleteDeviceToken({ deviceToken });
        } catch (error) {
          // 토큰 해제 실패는 로그아웃 진행을 막지 않음
          if (__DEV__) {
            console.error("토큰 해제 실패", error);
          }
        }
      }

      if (deviceToken) {
        clearRegisteredDeviceToken();
      }

      clearSession();
      clearUser();
      for (const queryKey of AUTH_SCOPED_QUERY_KEY_PREFIXES) {
        queryClient.removeQueries({ queryKey });
      }
    },
    [clearSession, clearUser, queryClient],
  );
}
