# safeMedi — Agent Review (Quick)

Expo Router · React Native · Tamagui · TanStack Query · Zustand.

**Quick 리뷰**: 커밋 단위 변경에 대해 **머지 전 반드시 잡아야 할 버그·아키텍처 위반·보안**만 지적한다. Biome/포맷·사소한 네이밍·취향 리팩터는 생략한다.

---

## Language
- 모든 리뷰 코멘트, 요약, 수정 제안은 한국어로 작성한다.
- 코드 식별자/경로/에러 메세지는 원문(영문) 유지, 설명만 한국어로 작성한다.

## 반드시 지적 (Blocking)

### 보안·비밀

- `.env`, API 키, 토큰, 자격 증명이 diff에 포함되었는지
- 로그·에러 메시지에 PII·`accessToken` 노출 여부

### 아키텍처 위반

- `app/` 라우트에 비즈니스 로직·복잡 UI·fetch 직접 호출 (라우트는 Screen re-export만)
- `api/queries` 없이 컴포넌트에서 직접 `fetch` / endpoint 호출
- 새 `useQuery`/`useMutation`인데 `api/query-keys.ts`에 키 미추가
- 인증 API 호출에 `enabled: !!accessToken` (`useSessionStore`) 누락
- `api/mock/`을 프로덕션 import 경로에 연결
- feature 구조 위반: `features/{feature}/` 에 Screen·ViewModel 배치

### 타입·런타임

- `any` 사용, `@ts-ignore` / `@ts-expect-error` 무단 추가
- null/undefined 미처리로 크래시 가능 (optional chaining·가드 누락)
- 리스트 `key={index}` (동적 목록)

### React / RN

- `useEffect`로 파생 상태만 동기화 (대신 `useMemo`·인라인 계산 권장)
- 인증 분기 시 `AuthGateView` / `useAuthRouteState` / session store 패턴과 불일치

---

## 중요하면 지적 (Non-blocking)

- 복잡 Screen에 `use{Feature}ViewModel`·`{Feature}ViewModel` interface 없음
- ViewModel/Screen 테스트 없이 로직·분기만 크게 추가
- `@/constants/design-tokens` 대신 임의 hex 남발
- `package.json` 의존성·API 스키마 변경인데 부수 효과(마이그레이션·env) 언급 없음
- 무관한 대규모 리팩터가 기능 변경과 한 커밋에 섞임

---

## 지적하지 않음 (Quick에서 생략)

- Biome이 잡는 포맷 (quote, semicolon, trailing comma, line width 100)
- `app/` 라우트의 **default export** (Expo Router 필수)
- 테스트·it 설명의 한국어 사용
- `coverage/`, `node_modules/` — 커밋 대상이면 그때만 blocking

---

## 변경 유형별 빠른 체크

| 변경 위치 | 확인 |
|-----------|------|
| `app/**` | 얇은 라우트만, `(tabs)` / `(detail)` / `(auth)` 그룹 유지 |
| `api/endpoints/**` | 순수 fetch, 부수 효과 최소 |
| `api/queries/**` | query key, `enabled`, `staleTime` 기존 도메인과 일관 |
| `api/types/**` | endpoint·hook과 타입 일치 |
| `features/**` | Screen + ViewModel + `components/` + `__tests__/` |
| `stores/**` | 세션·전역 UI만, 서버 상태는 Query |
| `components/ui/**` | 도메인 로직·API 호출 없음 |

---

## 리뷰 출력 형식

각 이슈마다:

1. **심각도**: blocking / suggestion
2. **파일·위치** (가능하면 줄 근처)
3. **문제** (한 문장)
4. **수정 방향** (패턴·경로 예시)

이슈가 없으면 짧게 **「blocking 이슈 없음」**만 보고한다.
