import { isHTTPError } from "ky";

type ErrorResponseBody = {
  code?: string;
  message?: string;
};

export type ApiErrorInfo = {
  status?: number;
  code?: string;
  message: string;
};

const FALLBACK_MESSAGE = "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

function toErrorResponseBody(value: unknown): ErrorResponseBody {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  return {
    code: typeof record.code === "string" ? record.code : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
  };
}

export function getHttpStatus(error: unknown): number | undefined {
  if (!isHTTPError(error)) return undefined;
  return error.response.status;
}

export function isUnauthorizedError(error: unknown): boolean {
  return getHttpStatus(error) === 401;
}

export async function parseApiError(error: unknown): Promise<ApiErrorInfo> {
  if (!isHTTPError(error)) {
    return { message: FALLBACK_MESSAGE };
  }

  const status = error.response.status;
  let code: string | undefined;
  let message: string | undefined;

  try {
    const body = toErrorResponseBody(await error.response.clone().json());
    code = body.code;
    message = body.message;
  } catch {
    // 응답이 JSON이 아니거나 body를 파싱할 수 없는 경우 기본 메시지를 사용합니다.
  }

  if (!message) {
    if (status >= 500) {
      message = "서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    } else if (status === 401) {
      message = "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    } else {
      message = FALLBACK_MESSAGE;
    }
  }

  return { status, code, message };
}
