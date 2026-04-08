/**
 * API 환경 설정. Expo에서는 `EXPO_PUBLIC_*` 변수가 번들에 포함됩니다.
 *
 * - `EXPO_PUBLIC_USE_MOCK_API`: mock 응답 사용 여부
 * - `EXPO_PUBLIC_API_BASE_URL`: 호스트 루트 (예: `https://api.example.com`). API 경로는 코드에서 `/api/v1/...` 로 붙습니다 (SAF-26).
 */
const env = process.env;

function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  const v = value.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export const apiConfig = {
  /** mock 모드일 때 네트워크 대신 등록된 mock 핸들러로 응답 */
  useMock: parseBool(env.EXPO_PUBLIC_USE_MOCK_API, __DEV__),

  /** API 베이스 URL (끝 슬래시 없이 권장) */
  baseUrl: env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "https://api.safemedi.local",

  /** ky timeout (ms) */
  timeoutMs: 30_000,
} as const;

export type ApiConfig = typeof apiConfig;
