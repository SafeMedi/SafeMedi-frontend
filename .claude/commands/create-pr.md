---
description: 린트·테스트·분기 커버리지 체크와 safemedi-reviewer+Codex 병렬 코드 리뷰를 거쳐 safeMedi PR 템플릿에 맞춰 PR 생성
argument-hint: [선택: Linear 티켓명이나 PR 설명]
---

PR을 생성하기 전, 아래 순서를 하나도 건너뛰지 않고 실행한다.

## 1단계 — 사전 체크 (`/pr-check`와 동일)

1. `git status` — uncommitted 변경이 없어야 한다. 있으면 커밋 여부를 사용자에게 확인한다 (자동 커밋 금지).
2. `yarn lint` 통과 확인.
3. `yarn test` 통과 확인.

하나라도 실패하면 여기서 중단하고 사용자에게 보고한다. PR을 생성하지 않는다.

## 2단계 — 커버리지 게이트 (분기 커버리지 80% 권장)

1. `yarn test --coverage`를 실행한다.
2. `coverage/coverage-summary.json`을 읽어 `total.branches.pct` 값을 확인한다.
   - 이 체크는 `jest.config.js`의 전역 60% 임계값(lines/statements/functions/branches)과는 별개로, PR 생성 직전에만 자체적으로 추가하는 80% 기준이다. jest 설정 자체는 건드리지 않는다.
3. `total.branches.pct`가 80 미만이면:
   - PR 생성을 막지는 않는다 (경고만).
   - 현재 분기 커버리지 수치를 사용자에게 알리고, 이대로 계속 진행할지 확인한다.
4. 80 이상이면 통과로 보고하고 다음 단계로 진행한다.

## 3단계 — 코드 리뷰 (병렬, 필수)

PR 생성 직전 최종 점검이므로 절대 건너뛰지 않는다.

1. 이번 브랜치의 전체 변경(`git diff dev...HEAD` 기준)에 대해 `safemedi-reviewer` 서브에이전트와 Codex(`codex:codex-rescue` 에이전트 또는 `codex:rescue` 스킬)를 **병렬로 함께 호출**해 두 개의 독립적인 리뷰를 받는다. 어느 한쪽만 단독으로 돌리고 끝내지 않는다.
2. 두 리뷰 결과를 종합해서 사용자에게 보고한다 — 한쪽에서만 잡아낸 이슈도 누락하지 않고, 두 리뷰가 상충하면 근거를 비교해서 판단한다.
3. P0/P1(반드시 지적) 이슈가 있으면 먼저 수정하고, 관련 있는 경우 1단계(lint/test)를 다시 통과시킨다. 수정 없이 다음 단계로 넘어가지 않는다.
4. Suggestion(non-blocking) 이슈는 사용자에게 알리고 반영 여부를 확인한다.

## 4단계 — PR 생성

1. 현재 브랜치가 `main`/`dev`가 아닌지 확인한다 (gitflow 규칙상 이 브랜치들에서 직접 작업 금지).
2. 원격에 브랜치가 push 되어 있는지 확인하고, 안 되어 있으면 push해도 되는지 사용자에게 확인 후 진행한다 (임의 force push 금지).
3. base 브랜치는 기본적으로 `dev` (release→main 승격 PR만 예외적으로 `main`).
4. `git log`/`git diff dev...HEAD`로 이번 브랜치의 전체 커밋을 파악해 제목과 본문 초안을 작성한다:
   - 제목: `[SAF-00] type: 작업 내용` 형식 — 실제 Linear 티켓명이 있으면 사용자에게 확인한다.
   - 본문: `.github/PULL_REQUEST_TEMPLATE.md`의 섹션(🎟️ 관련 이슈 / 🔥 작업 배경 / 🛠️ 작업 내용 / 🧪 테스트 / 💬 기타 논의 사항 / ✅ 셀프 체크리스트)을 실제 내용으로 채운다. 빈 placeholder로 남기지 않는다.
5. `gh pr create`로 생성한다. assignee는 `@me`, base는 위에서 정한 브랜치.
6. 생성된 PR URL을 사용자에게 전달한다.

## 금지 사항

- `--no-verify`, hook 우회, force push 금지.
- 1단계·2단계·3단계 결과를 조용히 넘기지 않는다 — 매 단계 결과를 사용자에게 보고한다.
- 3단계(병렬 코드 리뷰)를 생략하고 곧바로 PR을 생성하지 않는다.
- 관련 없는 파일 변경을 커밋·PR에 포함시키지 않는다.
