import type { MockRegistry } from "@/api/mock/registry";
import { mockState } from "@/api/mock/state";
import { apiPaths } from "@/api/paths";

const SUPPORTED_PROVIDERS = new Set(["kakao", "naver"]);

const RX = {
  authLogin: /^\/api\/v1\/auth\/login\/([^/]+)$/,
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

function clonePrescriptions() {
  return mockState.prescriptions.map((prescription) => ({
    ...prescription,
    medications: prescription.medications.map((medication) => ({
      ...medication,
      takeTimes: [...medication.takeTimes],
    })),
  }));
}

function addDaysToDateText(dateText: string, days: number): string {
  const parsedDate = new Date(`${dateText}T00:00:00`);
  parsedDate.setDate(parsedDate.getDate() + days);
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildMockWeeklyDailyCompliance(startDate: string) {
  const weeklyRates = [
    { takenCount: 17, totalCount: 20 },
    { takenCount: 9, totalCount: 10 },
    { takenCount: 3, totalCount: 4 },
    { takenCount: 19, totalCount: 20 },
    { takenCount: 4, totalCount: 5 },
    { takenCount: 5, totalCount: 5 },
    { takenCount: 9, totalCount: 10 },
  ];

  return weeklyRates.map((entry, index) => {
    const date = addDaysToDateText(startDate, index);
    return {
      date,
      takenCount: entry.takenCount,
      totalCount: entry.totalCount,
      fraction: `${entry.takenCount}/${entry.totalCount}`,
    };
  });
}

export function registerSaf26Mocks(registry: MockRegistry): void {
  // --- Auth ---
  registry.registerMatch(
    "POST",
    (p) => RX.authLogin.test(p),
    async (ctx) => {
      const provider = ctx.path.match(RX.authLogin)?.[1];
      if (!provider || !SUPPORTED_PROVIDERS.has(provider)) {
        return Response.json(
          { code: "AUTH_002", message: "지원하지 않는 소셜 로그인 제공자입니다." },
          { status: 400 },
        );
      }

      const body = ctx.jsonBody as { accessToken?: string } | undefined;

      if (body?.accessToken === "server_error") {
        return Response.json(
          { code: "SYS_500", message: "소셜 인증 서버와의 통신에 실패했습니다." },
          { status: 500 },
        );
      }

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
      if (body.gender !== "MALE" && body.gender !== "FEMALE") {
        return Response.json(
          { code: "VAL_001", message: "성별 값이 올바르지 않습니다. (MALE, FEMALE만 허용)" },
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
      displayName: string;
      gender: "M" | "F";
      bloodType: string;
      diseases: string[];
      weight: number;
      allergies: string[];
      height: number;
    }>;
    if (patch.displayName !== undefined) {
      mockState.profile.displayName = patch.displayName;
    }
    if (patch.diseases) {
      mockState.profile.diseases = [...patch.diseases];
    }
    if (patch.gender !== undefined) {
      mockState.profile.gender = patch.gender;
    }
    if (patch.bloodType !== undefined) {
      mockState.profile.bloodType = patch.bloodType;
    }
    if (patch.weight !== undefined) mockState.profile.weight = patch.weight;
    if (patch.height !== undefined) mockState.profile.height = patch.height;
    if (patch.allergies) {
      mockState.profile.allergies = patch.allergies.map((value) => {
        const existing = mockState.profile.allergies.find(
          (a) => a.code === value || a.name === value,
        );
        return {
          code: existing?.code ?? value,
          name: existing?.name ?? value,
        };
      });
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

  registry.register("GET", apiPaths.familiesManage, () => ({
    ...mockState.familyManageOverview,
    members: mockState.familyManageOverview.members.map((member) => ({ ...member })),
    pendingInvites: mockState.familyManageOverview.pendingInvites.map((invite) => ({ ...invite })),
    benefits: [...mockState.familyManageOverview.benefits],
  }));

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
      const familyDetail = id !== undefined ? mockState.familyDetails[id] : undefined;
      if (!familyDetail) {
        return Response.json(
          { code: "FAM_002", message: "존재하지 않는 가족 ID" },
          { status: 404 },
        );
      }
      mockState.familyAlertConsent.set(id, body.isAlertConsent);
      familyDetail.isAlertConsent = body.isAlertConsent;
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
      if (!id) {
        return Response.json(
          { code: "FAM_002", message: "존재하지 않는 가족 ID" },
          { status: 404 },
        );
      }
      const familyDetail = mockState.familyDetails[id];
      if (!familyDetail) {
        return Response.json(
          { code: "FAM_002", message: "존재하지 않거나 연동이 해제된 가족" },
          { status: 404 },
        );
      }
      const consent = mockState.familyAlertConsent.get(id) ?? familyDetail.isAlertConsent;
      return { ...familyDetail, isAlertConsent: consent };
    },
    { label: "GET /api/v1/families/:familyId" },
  );

  registry.registerMatch(
    "DELETE",
    (p) => RX.familyId.test(p) && !RX.familySettings.test(p),
    (ctx) => {
      const id = parsePathId(ctx.path, RX.familyId);
      if (!id || !mockState.familyDetails[id]) {
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
  registry.register("GET", apiPaths.prescriptions, () => ({
    prescriptions: clonePrescriptions(),
  }));

  registry.register(
    "POST",
    apiPaths.prescriptions,
    async (ctx) => {
      const body = ctx.jsonBody as {
        title?: string;
        startDate?: string;
        endDate?: string;
        medications?: {
          atcCode: string;
          drugName: string;
          takeTimes?: string[];
        }[];
      };
      if (!body?.medications?.length) {
        return Response.json(
          { code: "MED_002", message: "약물 목록(medications)이 비어있음" },
          { status: 400 },
        );
      }
      if (!body?.title || body.title.trim().length === 0) {
        return Response.json(
          { code: "MED_004", message: "처방전 제목(title)을 입력해 주세요." },
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
      const medications = body.medications.map((medication) => {
        const hasWarning = mockState.profile.allergies.some((a) =>
          medication.atcCode.startsWith(a.code),
        );
        return {
          medicationId: mockState.medicationIdSeq++,
          atcCode: medication.atcCode,
          drugName: medication.drugName,
          takeTimes: medication.takeTimes ?? [],
          mainIngredient: medication.drugName,
          hasWarning,
          warningMessage: hasWarning
            ? "알러지 충돌이 발견되었습니다. 의사와 상담 후 복용하세요."
            : null,
        };
      });
      const conflict = medications.some((medication) => medication.hasWarning);
      mockState.prescriptions.push({
        prescriptionId: id,
        title: body.title,
        medications,
      });
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
      const index = mockState.prescriptions.findIndex(
        (prescription) => prescription.prescriptionId === id,
      );
      if (index < 0) {
        return Response.json(
          { code: "MED_005", message: "존재하지 않는 처방전입니다." },
          { status: 404 },
        );
      }
      mockState.prescriptions.splice(index, 1);
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
        medications?: { atcCode: string; drugName: string; takeTimes?: string[] }[];
      };
      const prescription = mockState.prescriptions.find((item) => item.prescriptionId === id);
      if (!prescription) {
        return Response.json(
          { code: "MED_005", message: "존재하지 않는 처방전입니다." },
          { status: 404 },
        );
      }
      const title = body.title ?? prescription.title;
      const medications = body.medications?.map((medication, index) => {
        const existing =
          prescription.medications.find(
            (item) => item.atcCode === medication.atcCode && item.drugName === medication.drugName,
          ) ??
          prescription.medications.find((item) => item.atcCode === medication.atcCode) ??
          prescription.medications[index];
        return {
          medicationId: existing?.medicationId ?? mockState.medicationIdSeq++,
          atcCode: medication.atcCode,
          drugName: medication.drugName,
          takeTimes: medication.takeTimes
            ? [...medication.takeTimes]
            : [...(existing?.takeTimes ?? [])],
          mainIngredient: existing?.mainIngredient ?? medication.drugName,
          hasWarning: existing?.hasWarning ?? false,
          warningMessage: existing?.warningMessage,
        };
      });
      mockState.prescriptions = mockState.prescriptions.map((item) =>
        item.prescriptionId === prescription.prescriptionId
          ? { ...prescription, title, medications: medications ?? prescription.medications }
          : item,
      );
      return {
        prescriptionId: prescription.prescriptionId,
        title,
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
                prescriptionTitle: "두통/해열 약물 관리",
                medicationNames: ["타이레놀정 500mg", "아세트아미노펜"],
                scheduledTime: "08:00",
                takenTime: "08:05",
                status: "SUCCESS",
              },
              {
                recordId: 501,
                prescriptionTitle: "위장 약물 관리",
                medicationNames: ["오메프라졸캡슐 20mg", "오메프라졸"],
                scheduledTime: "08:00",
                takenTime: "08:10",
                status: "SUCCESS",
              },
              {
                recordId: 502,
                prescriptionTitle: "혈압 약물 관리",
                medicationNames: ["암로디핀정 5mg", "암로디핀베실산염"],
                scheduledTime: "14:00",
                takenTime: null,
                status: "OVERDUE",
                warningMessages: ["설파제 알러지 - 교차 반응 가능성", "자몽주스와 함께 복용 금지"],
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

    const dailyCompliance = buildMockWeeklyDailyCompliance(start);
    const totalScheduled = dailyCompliance.reduce((sum, day) => sum + day.totalCount, 0);
    const totalTaken = dailyCompliance.reduce((sum, day) => sum + day.takenCount, 0);
    const totalComplianceRate =
      totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 1000) / 10 : 0;

    return {
      startDate: start,
      endDate: end,
      totalScheduled,
      totalTaken,
      totalComplianceRate,
      dailyCompliance,
      cautionIngredients: [
        {
          ingredientName: "아세트아미노펜",
          monthlyIntakeCount: 12,
          riskLevel: "CAUTION",
        },
        {
          ingredientName: "이부프로펜",
          monthlyIntakeCount: 8,
          riskLevel: "DANGER",
        },
        {
          ingredientName: "카페인",
          monthlyIntakeCount: 15,
          riskLevel: "CAUTION",
        },
      ],
      consultationMessage:
        "일부 성분의 섭취 빈도가 높습니다. 정기 검진 시 복용 중인 약물 목록을 의사에게 알려주세요.",
      monthlyAchievements: [
        { message: "연속 7일 완벽한 복약 달성!" },
        { message: "이번 달 평균 이행률 목표(80%) 초과" },
      ],
    };
  });

  // --- Notifications ---
  registry.register("GET", apiPaths.notificationsSettings, () => ({
    ...mockState.notificationSettings,
  }));

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
