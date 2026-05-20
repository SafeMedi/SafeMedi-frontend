import * as fs from "fs";
import * as path from "path";

const BUGBOT_PATH = path.join(__dirname, "..", "BUGBOT.md");

describe("BUGBOT.md — 코드 리뷰 가이드라인 검증", () => {
  let content: string;
  let lines: string[];

  beforeAll(() => {
    content = fs.readFileSync(BUGBOT_PATH, "utf-8");
    lines = content.split("\n");
  });

  // ──────────────────────────────────────────────────────────────
  // 1. 파일 존재 및 기본 구조
  // ──────────────────────────────────────────────────────────────
  describe("파일 기본 구조", () => {
    it("BUGBOT.md 파일이 존재한다", () => {
      expect(fs.existsSync(BUGBOT_PATH)).toBe(true);
    });

    it("파일이 비어있지 않다", () => {
      expect(content.trim().length).toBeGreaterThan(0);
    });

    it("올바른 UTF-8 인코딩으로 읽을 수 있다", () => {
      expect(() => fs.readFileSync(BUGBOT_PATH, "utf-8")).not.toThrow();
    });

    it("Markdown H1 제목으로 시작한다", () => {
      const firstHeading = lines.find((line) => line.startsWith("# "));
      expect(firstHeading).toBeDefined();
      expect(firstHeading).toMatch(/^# safeMedi/);
    });

    it("프로젝트 기술 스택이 명시되어 있다", () => {
      const techStackLine = lines.find(
        (line) =>
          line.includes("Expo Router") &&
          line.includes("React Native") &&
          line.includes("Tamagui") &&
          line.includes("TanStack Query") &&
          line.includes("Zustand"),
      );
      expect(techStackLine).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 2. 필수 섹션 존재 확인
  // ──────────────────────────────────────────────────────────────
  describe("필수 섹션 존재", () => {
    it("Blocking 섹션이 존재한다", () => {
      expect(content).toContain("## 반드시 지적 (Blocking)");
    });

    it("Non-blocking 섹션이 존재한다", () => {
      expect(content).toContain("## 중요하면 지적 (Non-blocking)");
    });

    it("생략 섹션이 존재한다", () => {
      expect(content).toContain("## 지적하지 않음 (Quick에서 생략)");
    });

    it("변경 유형별 체크 섹션이 존재한다", () => {
      expect(content).toContain("## 변경 유형별 빠른 체크");
    });

    it("리뷰 출력 형식 섹션이 존재한다", () => {
      expect(content).toContain("## 리뷰 출력 형식");
    });

    it("총 5개 이상의 H2 섹션을 포함한다", () => {
      const h2Sections = lines.filter((line) => line.startsWith("## "));
      expect(h2Sections.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 3. Blocking 섹션 — 보안·비밀 규칙
  // ──────────────────────────────────────────────────────────────
  describe("Blocking — 보안·비밀 규칙", () => {
    it("보안·비밀 서브섹션이 존재한다", () => {
      expect(content).toContain("### 보안·비밀");
    });

    it(".env 파일 노출 검사 규칙이 명시되어 있다", () => {
      expect(content).toContain(".env");
    });

    it("API 키·토큰·자격 증명 검사가 포함되어 있다", () => {
      expect(content).toMatch(/API 키|토큰|자격 증명/);
    });

    it("PII 노출 검사 규칙이 존재한다", () => {
      expect(content).toContain("PII");
    });

    it("accessToken 노출 검사 규칙이 존재한다", () => {
      expect(content).toContain("accessToken");
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 4. Blocking 섹션 — 아키텍처 위반 규칙
  // ──────────────────────────────────────────────────────────────
  describe("Blocking — 아키텍처 위반 규칙", () => {
    it("아키텍처 위반 서브섹션이 존재한다", () => {
      expect(content).toContain("### 아키텍처 위반");
    });

    it("app/ 라우트 규칙(Screen re-export만 허용)이 명시되어 있다", () => {
      expect(content).toMatch(/app\/.*라우트.*Screen/s);
    });

    it("api/queries 우회 금지 규칙이 있다", () => {
      expect(content).toContain("api/queries");
    });

    it("api/query-keys.ts 키 추가 규칙이 있다", () => {
      expect(content).toContain("api/query-keys.ts");
    });

    it("enabled: !!accessToken 인증 가드 규칙이 있다", () => {
      expect(content).toContain("enabled: !!accessToken");
    });

    it("useSessionStore 언급이 있다", () => {
      expect(content).toContain("useSessionStore");
    });

    it("api/mock/ 프로덕션 import 금지 규칙이 있다", () => {
      expect(content).toContain("api/mock/");
    });

    it("feature 디렉터리 구조 규칙이 있다", () => {
      expect(content).toContain("components/domains/{domain}/{feature}/");
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 5. Blocking 섹션 — 타입·런타임 규칙
  // ──────────────────────────────────────────────────────────────
  describe("Blocking — 타입·런타임 규칙", () => {
    it("타입·런타임 서브섹션이 존재한다", () => {
      expect(content).toContain("### 타입·런타임");
    });

    it("any 사용 금지 규칙이 있다", () => {
      expect(content).toContain("`any`");
    });

    it("ts-ignore 사용 금지 규칙이 있다", () => {
      expect(content).toContain("@ts-ignore");
    });

    it("ts-expect-error 사용 금지 규칙이 있다", () => {
      expect(content).toContain("@ts-expect-error");
    });

    it("null/undefined 미처리 경고 규칙이 있다", () => {
      expect(content).toMatch(/null\/undefined|optional chaining/);
    });

    it("동적 목록에서 key={index} 사용 금지 규칙이 있다", () => {
      expect(content).toContain("key={index}");
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 6. Blocking 섹션 — React / RN 규칙
  // ──────────────────────────────────────────────────────────────
  describe("Blocking — React / RN 규칙", () => {
    it("React / RN 서브섹션이 존재한다", () => {
      expect(content).toContain("### React / RN");
    });

    it("useEffect 파생 상태 금지 규칙이 있다", () => {
      expect(content).toContain("useEffect");
    });

    it("useMemo 대안 권장이 명시되어 있다", () => {
      expect(content).toContain("useMemo");
    });

    it("AuthGateView 패턴 일관성 규칙이 있다", () => {
      expect(content).toContain("AuthGateView");
    });

    it("useAuthRouteState 패턴이 언급되어 있다", () => {
      expect(content).toContain("useAuthRouteState");
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 7. Non-blocking 섹션 — 중요하지만 머지 블로킹 아님
  // ──────────────────────────────────────────────────────────────
  describe("Non-blocking 규칙", () => {
    it("ViewModel 인터페이스 권장이 포함되어 있다", () => {
      expect(content).toMatch(/use\{Feature\}ViewModel|ViewModel.*interface/);
    });

    it("테스트 누락 경고가 있다", () => {
      expect(content).toMatch(/ViewModel\/Screen 테스트/);
    });

    it("design-tokens 사용 권장이 있다", () => {
      expect(content).toContain("@/constants/design-tokens");
    });

    it("hex 색상 남용 경고가 있다", () => {
      expect(content).toContain("hex");
    });

    it("package.json 의존성 변경 시 주의사항이 있다", () => {
      expect(content).toContain("package.json");
    });

    it("무관 리팩터와 기능 변경 분리 권장이 있다", () => {
      expect(content).toMatch(/리팩터.*기능 변경|기능 변경.*리팩터/);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 8. 생략(스킵) 섹션 — Quick 리뷰에서 제외되는 항목
  // ──────────────────────────────────────────────────────────────
  describe("생략(Skip) 규칙", () => {
    it("Biome 포맷 검사는 생략 대상이다", () => {
      expect(content).toContain("Biome");
    });

    it("한국어 테스트 설명은 생략 대상이다", () => {
      expect(content).toMatch(/테스트.*한국어|한국어.*테스트/);
    });

    it("coverage/ 디렉터리는 커밋 대상일 때만 blocking이다", () => {
      expect(content).toContain("coverage/");
    });

    it("node_modules/는 커밋 대상일 때만 blocking이다", () => {
      expect(content).toContain("node_modules/");
    });

    it("Expo Router default export는 생략 대상이다", () => {
      expect(content).toContain("default export");
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 9. 변경 유형별 체크 테이블 구조
  // ──────────────────────────────────────────────────────────────
  describe("변경 유형별 체크 테이블", () => {
    it("Markdown 테이블이 포함되어 있다", () => {
      // 테이블 헤더 구분자 행 검사
      const tableLines = lines.filter((line) => line.startsWith("|") && line.endsWith("|"));
      expect(tableLines.length).toBeGreaterThanOrEqual(3);
    });

    it("테이블에 app/** 행이 있다", () => {
      const appRow = lines.find((line) => line.includes("`app/**`"));
      expect(appRow).toBeDefined();
      expect(appRow).toContain("|");
    });

    it("테이블에 api/endpoints/** 행이 있다", () => {
      const row = lines.find((line) => line.includes("`api/endpoints/**`"));
      expect(row).toBeDefined();
    });

    it("테이블에 api/queries/** 행이 있다", () => {
      const row = lines.find((line) => line.includes("`api/queries/**`"));
      expect(row).toBeDefined();
    });

    it("테이블에 api/types/** 행이 있다", () => {
      const row = lines.find((line) => line.includes("`api/types/**`"));
      expect(row).toBeDefined();
    });

    it("테이블에 components/domains/** 행이 있다", () => {
      const row = lines.find((line) => line.includes("`components/domains/**`"));
      expect(row).toBeDefined();
    });

    it("테이블에 stores/** 행이 있다", () => {
      const row = lines.find((line) => line.includes("`stores/**`"));
      expect(row).toBeDefined();
    });

    it("테이블에 components/ui/** 행이 있다", () => {
      const row = lines.find((line) => line.includes("`components/ui/**`"));
      expect(row).toBeDefined();
    });

    it("app/** 행에 탭 그룹 언급이 있다", () => {
      const appRow = lines.find((line) => line.includes("`app/**`"));
      expect(appRow).toMatch(/\(tabs\)|\(detail\)|\(auth\)/);
    });

    it("components/domains/** 행에 __tests__ 언급이 있다", () => {
      const row = lines.find((line) => line.includes("`components/domains/**`"));
      expect(row).toContain("__tests__");
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 10. 리뷰 출력 형식
  // ──────────────────────────────────────────────────────────────
  describe("리뷰 출력 형식", () => {
    it("심각도(blocking/suggestion) 필드가 명시되어 있다", () => {
      expect(content).toContain("blocking");
      expect(content).toContain("suggestion");
    });

    it("파일·위치 정보 출력이 요구된다", () => {
      expect(content).toMatch(/파일.위치/);
    });

    it("문제 설명 출력이 요구된다", () => {
      expect(content).toMatch(/문제/);
    });

    it("수정 방향 출력이 요구된다", () => {
      expect(content).toMatch(/수정 방향/);
    });

    it("이슈 없음 시 출력 형식이 명시되어 있다", () => {
      expect(content).toContain("blocking 이슈 없음");
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 11. 경계·회귀 케이스
  // ──────────────────────────────────────────────────────────────
  describe("경계 및 회귀 케이스", () => {
    it("파일이 최소 50줄 이상이다", () => {
      const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
      expect(nonEmptyLines.length).toBeGreaterThanOrEqual(50);
    });

    it("파일 끝이 개행 문자로 끝난다", () => {
      expect(content.endsWith("\n")).toBe(true);
    });

    it("구분선(---)이 최소 4개 이상 사용되어 섹션을 구분한다", () => {
      const separators = lines.filter((line) => line.trim() === "---");
      expect(separators.length).toBeGreaterThanOrEqual(4);
    });

    it("Blocking 섹션이 Non-blocking 섹션보다 먼저 나온다", () => {
      const blockingIdx = content.indexOf("## 반드시 지적 (Blocking)");
      const nonBlockingIdx = content.indexOf("## 중요하면 지적 (Non-blocking)");
      expect(blockingIdx).toBeLessThan(nonBlockingIdx);
    });

    it("Non-blocking 섹션이 생략 섹션보다 먼저 나온다", () => {
      const nonBlockingIdx = content.indexOf("## 중요하면 지적 (Non-blocking)");
      const skipIdx = content.indexOf("## 지적하지 않음 (Quick에서 생략)");
      expect(nonBlockingIdx).toBeLessThan(skipIdx);
    });

    it("출력 형식 섹션이 문서 마지막에 위치한다", () => {
      const outputFormatIdx = content.indexOf("## 리뷰 출력 형식");
      const checkTableIdx = content.indexOf("## 변경 유형별 빠른 체크");
      expect(outputFormatIdx).toBeGreaterThan(checkTableIdx);
    });

    it("파일에 실제 민감 정보(하드코딩된 시크릿)가 없다", () => {
      // BUGBOT.md 자체에 실제 API 키나 토큰이 없어야 한다
      expect(content).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
      expect(content).not.toMatch(/Bearer [a-zA-Z0-9._-]{20,}/);
      expect(content).not.toMatch(/password\s*=\s*["'][^"']{4,}["']/i);
    });

    it("Blocking 섹션에 4개의 서브섹션이 있다", () => {
      const blockingStart = content.indexOf("## 반드시 지적 (Blocking)");
      const nonBlockingStart = content.indexOf("## 중요하면 지적 (Non-blocking)");
      const blockingSection = content.slice(blockingStart, nonBlockingStart);
      const subSections = blockingSection.match(/^### /gm);
      expect(subSections?.length).toBe(4);
    });
  });
});
