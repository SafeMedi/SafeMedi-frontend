import type { MockRegistry } from "@/api/mock/registry";
import { mockState } from "@/api/mock/state";
import { apiPaths } from "@/api/paths";

const RX = {
  authLogin: /^\/api\/v1\/auth\/login\/(kakao|naver)$/,
  familyRequestId: /^\/api\/v1\/families\/requests\/(\d+)$/,
  familyId: /^\/api\/v1\/families\/(\d+)$/,
  familySettings: /^\/api\/v1\/families\/(\d+)\/settings$/,
  prescriptionId: /^\/api\/v1\/prescriptions\/(\d+)$/,
  medicationRecordId: /^\/api\/v1\/medication-records\/(\d+)$/,
};

function parsePathId(path: string, rx: RegExp): number | undefined {
  const m = path.match(rx);
  return m?.[1] ? Number(m[1]) : undefined;
}

export function registerSaf26Mocks(registry: MockRegistry): void {
  // --- Auth ---
  registry.registerMatch(
    "POST",
    (p) => RX.authLogin.test(p),
    async (ctx) => {
      const body = ctx.jsonBody as { accessToken?: string } | undefined;
      if (mockState.userDeleted || body?.accessToken === "invalid") {
        return Response.json(
          { code: "AUTH_001", message: "유효하지 않거나 만료된 소셜 토큰입니다." },
          { status: 401 },
        );
      }
      return {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock",
        isTutorialCompleted: mockState.profile.isTutorialCompleted,
      };
    },
    { label: "POST /api/v1/auth/login/:provider" },
  );

  // --- User: tutorial (구체 경로를 /users/me 보다 먼저 등록) ---
  registry.register(
    "POST",
    apiPaths.usersMeTutorial,
    async (ctx) => {
      if (mockState.profile.isTutorialCompleted) {
        return Response.json(
          { code: "TUT_001", message: "이미 완료된 튜토리얼 중복 요청" },
          { status: 400 },
        );
      }
      const body = ctx.jsonBody as { gender?: string } | undefined;
      if (body?.gender && body.gender !== "M" && body.gender !== "F") {
        return Response.json(
          { code: "VAL_001", message: "성별 값이 올바르지 않습니다. (M, F만 허용)" },
          { status: 400 },
        );
      }
      mockState.profile.isTutorialCompleted = true;
      mockState.tutorialCompleted = true;
      return {
        message: "튜토리얼 정보가 성공적으로 등록되었습니다.",
        isTutorialCompleted: true,
      };
    },
    { status: 201 },
  );

  registry.register("GET", apiPaths.usersMe, () => {
    if (mockState.userDeleted) {
      return Response.json(
        { code: "USER_001", message: "존재하지 않는 사용자 정보" },
        { status: 404 },
      );
    }
    return { ...mockState.profile };
  });

  registry.register("PATCH", apiPaths.usersMe, async (ctx) => {
    const patch = ctx.jsonBody as Partial<{
      weight: number;
      allergies: string[];
      height: number;
    }>;
    if (patch.weight !== undefined) mockState.profile.weight = patch.weight;
    if (patch.height !== undefined) mockState.profile.height = patch.height;
    if (patch.allergies) {
      mockState.profile.allergies = patch.allergies.map((code) => ({
        code,
        name:
          code === "M01AE01"
            ? "이부프로펜"
            : (mockState.profile.allergies.find((a) => a.code === code)?.name ?? code),
      }));
    }
    return { ...mockState.profile };
  });

  registry.register("DELETE", apiPaths.usersMe, () => {
    mockState.userDeleted = true;
    return { message: "회원 탈퇴가 정상적으로 완료되었습니다." };
  });

  registry.register("POST", apiPaths.usersDeviceToken, () => ({
    message: "기기 푸시 토큰이 성공적으로 등록(갱신)되었습니다.",
  }));

  // --- Family: received (목록) ---
  registry.register("GET", apiPaths.familiesRequestsReceived, () => [
    ...mockState.receivedRequests,
  ]);

  registry.register(
    "POST",
    apiPaths.familiesRequests,
    async (ctx) => {
      const body = ctx.jsonBody as { targetInviteCode?: string; relation?: string };
      if (!body?.targetInviteCode || body.targetInviteCode === "INVALID") {
        return Response.json(
          { code: "REQ_001", message: "유효하지 않은 초대 코드입니다. 다시 확인해 주세요." },
          { status: 404 },
        );
      }
      if (body.targetInviteCode === "SELF") {
        return Response.json(
          { code: "REQ_003", message: "자기 자신의 코드로 요청할 수 없음" },
          { status: 400 },
        );
      }
      const id = mockState.nextFamilyRequestId++;
      return {
        requestId: id,
        targetName: "김영희",
        relation: body.relation ?? "MOTHER",
        status: "PENDING",
        requestedAt: "2026-04-06T15:30:00",
      };
    },
    { status: 201 },
  );

  registry.registerMatch(
    "PATCH",
    (p) => RX.familyRequestId.test(p) && !p.includes("/received"),
    (ctx) => {
      const id = parsePathId(ctx.path, RX.familyRequestId);
      const body = ctx.jsonBody as { action?: string; myRelationToSender?: string };
      if (!id || (body?.action === "ACCEPT" && !body?.myRelationToSender)) {
        return Response.json(
          { code: "REQ_004", message: "이미 처리되었거나 상대방이 취소한 요청입니다." },
          { status: 400 },
        );
      }
      return {
        requestId: id,
        status: body?.action === "REJECT" ? "REJECTED" : "ACCEPTED",
        updatedAt: "2026-04-06T15:35:00",
        isAlertConsent: true,
      };
    },
    { label: "PATCH /api/v1/families/requests/:requestId" },
  );

  registry.register("GET", apiPaths.families, () => mockState.families.map((f) => ({ ...f })));

  registry.registerMatch(
    "PATCH",
    (p) => RX.familySettings.test(p),
    (ctx) => {
      const id = parsePathId(ctx.path, RX.familySettings);
      const body = ctx.jsonBody as { isAlertConsent?: boolean };
      if (id === undefined) {
        return Response.json(
          { code: "FAM_002", message: "존재하지 않는 가족 ID" },
          { status: 404 },
        );
      }
      if (typeof body?.isAlertConsent !== "boolean") {
        return Response.json(
          { code: "VAL_004", message: "잘못된 설정 값입니다. (Boolean 형식이 필요합니다)" },
          { status: 400 },
        );
      }
      mockState.familyAlertConsent.set(id, body.isAlertConsent);
      return {
        familyId: id,
        isAlertConsent: body.isAlertConsent,
        message: "알림 설정이 변경되었습니다.",
      };
    },
    { label: "PATCH /api/v1/families/:familyId/settings" },
  );

  registry.registerMatch(
    "GET",
    (p) => RX.familyId.test(p) && !RX.familySettings.test(p),
    (ctx) => {
      const id = parsePathId(ctx.path, RX.familyId);
      if (id === 999) {
        return Response.json(
          { code: "FAM_002", message: "존재하지 않거나 연동이 해제된 가족" },
          { status: 404 },
        );
      }
      const consent =
        id !== undefined
          ? (mockState.familyAlertConsent.get(id) ?? mockState.familyDetail.isAlertConsent)
          : mockState.familyDetail.isAlertConsent;
      return { ...mockState.familyDetail, isAlertConsent: consent };
    },
    { label: "GET /api/v1/families/:familyId" },
  );

  registry.registerMatch(
    "DELETE",
    (p) => RX.familyId.test(p) && !RX.familySettings.test(p),
    (ctx) => {
      const id = parsePathId(ctx.path, RX.familyId);
      if (id === 999) {
        return Response.json(
          { code: "FAM_002", message: "존재하지 않는 가족 프로필입니다." },
          { status: 404 },
        );
      }
      return { message: "가족 연동이 성공적으로 해제되었습니다." };
    },
    { label: "DELETE /api/v1/families/:familyId" },
  );

  // --- Drugs ---
  registry.register("GET", apiPaths.drugsSearch, (ctx) => {
    const keyword = ctx.searchParams.get("keyword") ?? "";
    if (keyword.length < 2) {
      return Response.json(
        { code: "VAL_005", message: "검색어는 최소 2글자 이상 입력해야 합니다." },
        { status: 400 },
      );
    }
    return [
      {
        atcCode: "J01CA04",
        drugName: "종근당아목시실린캡슐500mg",
        company: "종근당",
      },
      {
        atcCode: "J01CA04",
        drugName: "보령아목시실린캡슐",
        company: "보령제약",
      },
      {
        atcCode: "J01CA04",
        drugName: "아목시실린시럽",
        company: "유한양행",
      },
    ];
  });

  // --- Prescriptions ---
  registry.register(
    "POST",
    apiPaths.prescriptions,
    async (ctx) => {
      const body = ctx.jsonBody as {
        title?: string;
        startDate?: string;
        endDate?: string;
        takeTimes?: string[];
        medications?: { atcCode: string; drugName: string }[];
      };
      if (!body?.medications?.length) {
        return Response.json(
          { code: "MED_002", message: "약물 목록(medications)이 비어있음" },
          { status: 400 },
        );
      }
      if (body.startDate && body.endDate && body.endDate < body.startDate) {
        return Response.json(
          { code: "MED_001", message: "종료일은 시작일보다 빠를 수 없습니다." },
          { status: 400 },
        );
      }
      const id = mockState.prescriptionIdSeq++;
      const conflict = body.medications.some((m) =>
        mockState.profile.allergies.some((a) => m.atcCode.startsWith(a.code)),
      );
      if (conflict) {
        return {
          prescriptionId: id,
          title: body.title ?? "",
          message: "처방전이 등록되었습니다. 단, 알러지 충돌이 발견되었습니다.",
          hasAllergyConflict: true,
          allergyWarnings: [
            {
              atcCode: "J01CA04",
              drugName: "아목시실린 캡슐",
              conflictWith: "페니실린계 항생제",
              warningMessage: "등록하신 '페니실린계 항생제' 알러지와 충돌하는 성분입니다.",
            },
          ],
        };
      }
      return {
        prescriptionId: id,
        title: body.title ?? "안과 인공눈물",
        message: "처방전이 안전하게 등록되었습니다.",
        hasAllergyConflict: false,
        allergyWarnings: [],
      };
    },
    { status: 201 },
  );

  registry.registerMatch(
    "DELETE",
    (p) => RX.prescriptionId.test(p),
    (ctx) => {
      const id = parsePathId(ctx.path, RX.prescriptionId);
      if (id === 99999) {
        return Response.json(
          { code: "MED_005", message: "존재하지 않는 처방전입니다." },
          { status: 404 },
        );
      }
      return { message: "처방전 및 예정된 복약 스케줄이 성공적으로 삭제되었습니다." };
    },
    { label: "DELETE /api/v1/prescriptions/:prescriptionId" },
  );

  registry.registerMatch(
    "PATCH",
    (p) => RX.prescriptionId.test(p),
    (ctx) => {
      const id = parsePathId(ctx.path, RX.prescriptionId);
      const body = ctx.jsonBody as {
        title?: string;
        takeTimes?: string[];
        medications?: { atcCode: string; drugName: string }[];
      };
      return {
        prescriptionId: id ?? 10,
        title: body.title ?? "수정된 이비인후과 감기약",
        takeTimes: body.takeTimes ?? ["09:00", "20:00"],
        medications: body.medications ?? [{ atcCode: "N02BE01", drugName: "타이레놀 500mg" }],
        message: "처방전 정보와 향후 복약 스케줄이 성공적으로 업데이트되었습니다.",
      };
    },
    { label: "PATCH /api/v1/prescriptions/:prescriptionId" },
  );

  // --- Medication records ---
  registry.registerMatch(
    "PATCH",
    (p) => RX.medicationRecordId.test(p),
    (ctx) => {
      const id = parsePathId(ctx.path, RX.medicationRecordId);
      const body = ctx.jsonBody as { status?: string };
      if (id === 99999) {
        return Response.json(
          { code: "REC_001", message: "존재하지 않는 복약 기록 ID" },
          { status: 404 },
        );
      }
      if (id === 888) {
        return Response.json(
          { code: "REC_002", message: "해당 시간에 이미 복용 처리가 완료된 기록입니다." },
          { status: 409 },
        );
      }
      return {
        recordId: id ?? 500,
        prescriptionId: 10,
        scheduledAt: "2026-04-06T08:00:00",
        takenAt: body?.status === "SUCCESS" ? "2026-04-06T08:05:30" : null,
        status: body?.status ?? "SUCCESS",
      };
    },
    { label: "PATCH /api/v1/medication-records/:recordId" },
  );

  registry.register("GET", apiPaths.medicationRecords, (ctx) => {
    const type = ctx.searchParams.get("type");
    const date = ctx.searchParams.get("date");
    if (!type || !date) {
      return Response.json(
        { code: "VAL_002", message: "Query 파라미터 누락 또는 날짜 포맷 에러" },
        { status: 400 },
      );
    }
    if (type !== "MONTH" && type !== "WEEK" && type !== "DAILY") {
      return Response.json(
        { code: "VAL_002", message: "type은 MONTH, WEEK, DAILY 중 하나여야 합니다." },
        { status: 400 },
      );
    }
    if (type === "MONTH") {
      return {
        period: "2026-04",
        summary: {
          totalCount: 9,
          takenCount: 8,
          fraction: "8/9",
          successRate: 88.8,
        },
        records: [
          {
            date: "2026-04-06",
            items: [
              {
                recordId: 500,
                prescriptionTitle: "환절기 비염 및 감기약",
                medicationNames: ["플루티카손 (스프레이)", "타이레놀 500mg"],
                scheduledTime: "08:00",
                takenTime: "08:05",
                status: "SUCCESS",
              },
              {
                recordId: 501,
                prescriptionTitle: "환절기 비염 및 감기약",
                medicationNames: ["플루티카손 (스프레이)", "타이레놀 500mg"],
                scheduledTime: "13:00",
                takenTime: null,
                status: "OVERDUE",
              },
            ],
          },
        ],
      };
    }
    if (type === "WEEK") {
      return {
        period: `2026-W14`,
        summary: {
          totalCount: 21,
          takenCount: 18,
          fraction: "18/21",
          successRate: 85.7,
        },
        records: [],
      };
    }
    return {
      date,
      currentTime: "12:30:00",
      summary: { totalCount: 3, takenCount: 1, fraction: "1/3" },
      records: [
        {
          recordId: 500,
          prescriptionTitle: "감기약",
          medicationNames: ["플루티카손 (스프레이)", "타이레놀 500mg"],
          scheduledTime: "08:00",
          takenTime: "08:05",
          status: "SUCCESS",
          isGoldenTime: false,
        },
        {
          recordId: 501,
          prescriptionTitle: "감기약",
          medicationNames: ["플루티카손 (스프레이)", "타이레놀 500mg"],
          scheduledTime: "13:00",
          takenTime: null,
          status: "DUE",
          isGoldenTime: true,
        },
        {
          recordId: 502,
          prescriptionTitle: "감기약",
          medicationNames: ["플루티카손 (스프레이)", "타이레놀 500mg"],
          scheduledTime: "19:00",
          takenTime: null,
          status: "UPCOMING",
          isGoldenTime: false,
        },
      ],
    };
  });

  // --- Statistics ---
  registry.register("GET", apiPaths.medicationsStatistics, (ctx) => {
    const start = ctx.searchParams.get("startDate");
    const end = ctx.searchParams.get("endDate");
    if (!start || !end || start > end) {
      return Response.json(
        { code: "VAL_002", message: "시작일이 종료일보다 늦을 수 없습니다." },
        { status: 400 },
      );
    }
    return {
      startDate: start,
      endDate: end,
      totalScheduled: 10,
      totalTaken: 7,
      totalComplianceRate: 70.0,
      dailyCompliance: [
        { date: "2026-04-01", takenCount: 5, totalCount: 5, fraction: "5/5" },
        { date: "2026-04-02", takenCount: 2, totalCount: 3, fraction: "2/3" },
        { date: "2026-04-03", takenCount: 0, totalCount: 2, fraction: "0/2" },
      ],
    };
  });

  // --- Notifications ---
  registry.register("PATCH", apiPaths.notificationsSettings, (ctx) => {
    const body = ctx.jsonBody as Partial<typeof mockState.notificationSettings>;
    Object.assign(mockState.notificationSettings, body, {
      updatedAt: "2026-04-07T10:00:00",
    });
    return { ...mockState.notificationSettings };
  });

  registry.register("GET", apiPaths.notifications, (ctx) => {
    const page = Number(ctx.searchParams.get("page") ?? "0");
    if (page < 0) {
      return Response.json(
        { code: "PAG_001", message: "페이지 번호(page)는 0 이상이어야 합니다." },
        { status: 400 },
      );
    }
    return mockState.notifications;
  });
}
