import ky, { HTTPError, type KyInstance, TimeoutError } from "ky";
import { mockRegistry, resolveFetchImplementation } from "@/api/mock";
import { apiConfig } from "@/constants/api-config";
import { useSessionStore } from "@/stores/sessionStore";

const fetchImpl = resolveFetchImplementation(mockRegistry);

type KyRequestError = {
  request?: Request;
};

async function readResponseBodyForLog(response: Response): Promise<unknown> {
  try {
    const text = await response.clone().text();
    if (!text) {
      return "(empty)";
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  } catch {
    return "(unreadable)";
  }
}

function getErrorRequest(error: unknown): Request | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const request = (error as KyRequestError).request;
  return request instanceof Request ? request : undefined;
}

function formatApiErrorForLog(error: unknown): string {
  const request = getErrorRequest(error);
  const requestLabel = request ? `${request.method} ${request.url}` : "unknown request";

  if (error instanceof HTTPError) {
    return `${error.response.status} ${requestLabel}`;
  }

  if (error instanceof TimeoutError) {
    return `timeout · ${requestLabel}`;
  }

  if (error instanceof Error) {
    const detail = error.message || error.name || "Unknown error";
    return `${detail} · ${requestLabel}`;
  }

  return `${String(error)} · ${requestLabel}`;
}

function logApiDev(message: string, ...details: unknown[]): void {
  if (!__DEV__) {
    return;
  }
  console.log(message, ...details);
}

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
        logApiDev(`[api] → ${request.method} ${request.url}`);
      },
    ],
    afterResponse: [
      async ({ request, response }) => {
        if (!response.ok) {
          return response;
        }

        const body = await readResponseBodyForLog(response);
        logApiDev(`[api] ← ${response.status} ${request.method} ${request.url}`, body);
        return response;
      },
    ],
    beforeError: [
      async ({ error }) => {
        const label = formatApiErrorForLog(error);

        if (error instanceof HTTPError) {
          const body = await readResponseBodyForLog(error.response);
          logApiDev(`[api] ✕ ${label}`, body);
        } else {
          logApiDev(`[api] ✕ ${label}`);
        }

        return error;
      },
    ],
  },
});
