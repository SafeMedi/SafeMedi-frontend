import { apiConfig } from "@/constants/api-config";

/**
 * ky가 요청하는 전체 URL에서 prefixUrl에 해당하는 부분을 뺀 경로를 반환합니다.
 * 예: base `https://a.com/v1`, full `https://a.com/v1/users` → `/users`
 */
export function pathRelativeToApiBase(
  requestUrl: string,
  apiBaseUrl: string = apiConfig.baseUrl,
): { pathname: string; searchParams: URLSearchParams } {
  const req = new URL(requestUrl);
  const base = new URL(apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`);

  const basePath = base.pathname.replace(/\/$/, "") || "";
  let pathname = req.pathname;

  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || "/";
  }

  if (!pathname.startsWith("/")) pathname = `/${pathname}`;

  return { pathname, searchParams: req.searchParams };
}
