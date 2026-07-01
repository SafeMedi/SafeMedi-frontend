import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { postDeviceToken } from "@/api/endpoints/device-token";
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  registerPushTokenWithBackend,
} from "@/hooks/push-notifications";
import { useSessionHydrated } from "@/hooks/use-session-hydrated";
import { useSessionStore } from "@/stores/sessionStore";

/**
 * 로그인 후 FCM 디바이스 토큰을 서버에 등록하고, 푸시 수신 시 알림 쿼리를 갱신합니다.
 */
export function PushNotificationSync() {
  const hydrated = useSessionHydrated();
  const accessToken = useSessionStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hydrated || !accessToken) {
      return;
    }

    let cancelled = false;

    void registerPushTokenWithBackend(async (body) => {
      if (cancelled) return;
      await postDeviceToken(body);
    }).catch(() => {
      // 권한 거부·시뮬레이터 등은 조용히 무시
    });

    const invalidateNotifications = () => {
      void queryClient.invalidateQueries({ queryKey: ["notification"] });
    };

    const receivedSubscription = addNotificationReceivedListener(() => {
      invalidateNotifications();
    });
    const responseSubscription = addNotificationResponseListener(() => {
      invalidateNotifications();
    });

    return () => {
      cancelled = true;
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [hydrated, accessToken, queryClient]);

  return null;
}
