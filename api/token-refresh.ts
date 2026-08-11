import { postReissueToken } from "@/api/endpoints/auth";
import { useSessionStore } from "@/stores/sessionStore";

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = useSessionStore.getState().refreshToken;
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await postReissueToken(refreshToken);
    // 응답을 기다리는 동안 로그아웃/재로그인으로 세션이 바뀌었다면 오래된 응답을 버린다.
    if (useSessionStore.getState().refreshToken !== refreshToken) {
      return null;
    }
    useSessionStore.getState().setAccessToken(response.accessToken);
    useSessionStore.getState().setRefreshToken(response.refreshToken);
    return response.accessToken;
  } catch {
    return null;
  }
}

/**
 * accessToken을 refreshToken으로 재발급합니다. 동시에 여러 요청이 401을 받아도
 * 재발급 API는 한 번만 호출되도록 in-flight 요청을 공유합니다(single-flight).
 */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}
