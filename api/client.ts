import ky, { type KyInstance } from "ky";
import { mockRegistry, resolveFetchImplementation } from "@/api/mock";
import { apiConfig } from "@/constants/api-config";
import { useSessionStore } from "@/stores/sessionStore";

const fetchImpl = resolveFetchImplementation(mockRegistry);

/**
 * 앱 전역에서 사용하는 ky 인스턴스.
 * mock 모드일 때는 등록된 핸들러만 응답합니다 (`/api/mock/handlers.ts`에서 등록).
 */
const baseUrl = apiConfig.baseUrl.endsWith("/") ? apiConfig.baseUrl : `${apiConfig.baseUrl}/`;

export const api: KyInstance = ky.create({
  baseUrl,
  timeout: apiConfig.timeoutMs,
  fetch: fetchImpl,
  hooks: {
    beforeRequest: [
      ({ request }) => {
        if (!request.headers.has("Authorization")) {
          const token = useSessionStore.getState().accessToken;
          if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
          }
        }
        if (__DEV__ && apiConfig.useMock) {
          console.debug("[api mock]", request.method, request.url);
        }
      },
    ],
  },
});
