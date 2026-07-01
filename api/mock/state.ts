import type {
  FamilyDetail,
  FamilyManageOverview,
  FamilySummary,
  NotificationListResponse,
  NotificationSettings,
  PrescriptionListItem,
  ReceivedFamilyRequest,
  UserProfile,
} from "@/api/types";

/** mock 전용 플래그·시퀀스 (API 스키마와 무관) */
type MockOnlyState = {
  userDeleted: boolean;
  tutorialCompleted: boolean;
  nextFamilyRequestId: number;
  prescriptionIdSeq: number;
  medicationIdSeq: number;
  medicationRecordIdSeq: number;
  familyAlertConsent: Map<number, boolean>;
};

/** SAF-26 mock 인메모리 상태 — 값의 형태는 API 응답 타입(`@/api/types`)과 맞춥니다. */
export const mockState: MockOnlyState & {
  profile: UserProfile;
  receivedRequests: ReceivedFamilyRequest[];
  families: FamilySummary[];
  familyManageOverview: FamilyManageOverview;
  familyDetails: Record<number, FamilyDetail>;
  notificationSettings: NotificationSettings;
  notifications: NotificationListResponse;
  prescriptions: PrescriptionListItem[];
} = {
  userDeleted: false,
  tutorialCompleted: false,
  profile: {
    displayName: "홍길동",
    birthDate: "2000-01-01",
    gender: "M",
    height: 180,
    weight: 75,
    bloodType: "O",
    diseases: ["비염"],
    allergies: [
      { code: "N02BE01", name: "아세트아미노펜" },
      { code: "J01CA", name: "페니실린계 항생제" },
    ],
    /** 로그인 mock은 튜토리얼 미완료 시 튜토리얼 화면 이동 시나리오 테스트용 */
    isTutorialCompleted: false,
  },

  nextFamilyRequestId: 103,

  receivedRequests: [
    {
      requestId: 100,
      senderId: 5,
      senderName: "정민성",
      proposedRelation: "MOTHER",
      status: "PENDING",
      requestedAt: "2026-04-06T15:30:00",
    },
    {
      requestId: 102,
      senderId: 12,
      senderName: "김동생",
      proposedRelation: "SIBLING",
      status: "PENDING",
      requestedAt: "2026-04-05T09:00:00",
    },
  ],

  families: [
    {
      familyId: 1,
      name: "어머니",
      relation: "MOTHER",
      birthDate: "1965-05-15",
      gender: "F",
    },
    {
      familyId: 2,
      name: "아버지",
      relation: "FATHER",
      birthDate: "1962-03-10",
      gender: "M",
    },
  ],

  familyManageOverview: {
    inviteLink: "https://medisafe.app/invite/ABC123XYZ",
    members: [
      { id: "me", name: "홍길동", relation: "본인", emoji: "👨", isActive: true },
      { id: "mother", name: "김영희", relation: "어머니", emoji: "👩", isActive: true },
    ],
    pendingInvites: [
      {
        id: "father",
        relation: "아버지",
        email: "father@email.com",
        invitedAt: "2026.03.18",
      },
    ],
    benefits: [
      "가족의 복약 알림을 함께 받아보세요",
      "복약을 놓친 가족에게 알림을 보낼 수 있어요",
      "가족의 건강 정보를 응급 상황에서 확인할 수 있어요",
    ],
  },

  familyDetails: {
    1: {
      familyId: 1,
      name: "김영희",
      relation: "MOTHER",
      birthDate: "1965-05-15",
      gender: "F",
      height: 160,
      weight: 55,
      bloodType: "A",
      diseases: ["고혈압"],
      allergies: [{ code: "J01CA", name: "페니실린계 항생제" }],
      isAlertConsent: true,
      todayMedicationSummary: {
        completedCount: 2,
        totalCount: 3,
        completionRate: 67,
        remainingCount: 1,
      },
      todayMedicationSchedules: [
        { id: "s-1", medicineName: "혈압약", scheduledTime: "08:00", status: "COMPLETED" },
        { id: "s-2", medicineName: "당뇨약", scheduledTime: "08:00", status: "COMPLETED" },
        { id: "s-3", medicineName: "혈압약", scheduledTime: "20:00", status: "PENDING" },
      ],
    },
    2: {
      familyId: 2,
      name: "김민수",
      relation: "FATHER",
      birthDate: "1962-03-10",
      gender: "M",
      height: 171,
      weight: 69,
      bloodType: "O",
      diseases: ["고지혈증"],
      allergies: [{ code: "N02BE01", name: "아세트아미노펜" }],
      isAlertConsent: false,
      todayMedicationSummary: {
        completedCount: 1,
        totalCount: 2,
        completionRate: 50,
        remainingCount: 1,
      },
      todayMedicationSchedules: [
        { id: "s-4", medicineName: "혈압약", scheduledTime: "09:00", status: "COMPLETED" },
        { id: "s-5", medicineName: "고지혈증약", scheduledTime: "21:00", status: "PENDING" },
      ],
    },
  },

  familyAlertConsent: new Map<number, boolean>([[1, true]]),

  prescriptionIdSeq: 26,
  medicationIdSeq: 202,
  medicationRecordIdSeq: 502,

  prescriptions: [
    {
      prescriptionId: 11,
      title: "신장내과 처방전",
      medications: [
        {
          medicationId: 101,
          prescriptionDrugId: 101,
          drugCode: "195700007",
          atcCode: "N02BE01",
          drugName: "타이레놀정 500mg",
          takeTimes: ["08:00", "18:00", "22:00"],
          mainIngredient: "아세트아미노펜",
          hasWarning: false,
        },
        {
          medicationId: 102,
          prescriptionDrugId: 102,
          drugCode: "200001234",
          atcCode: "A02BC01",
          drugName: "오메프라졸캡슐 20mg",
          takeTimes: ["08:00"],
          mainIngredient: "오메프라졸",
          hasWarning: false,
        },
      ],
    },
    {
      prescriptionId: 12,
      title: "심장내과 처방전",
      medications: [
        {
          medicationId: 201,
          prescriptionDrugId: 201,
          drugCode: "200101234",
          atcCode: "C08CA01",
          drugName: "암로디핀정 5mg",
          takeTimes: ["14:00"],
          mainIngredient: "암로디핀베실산염",
          hasWarning: true,
          warningMessage: "이 약물은 주의가 필요합니다. 의사와 상담 후 복용하세요.",
        },
      ],
    },
  ],

  notificationSettings: {
    userId: 1,
    isMyReminderOn: true,
    isFamilyReminderOn: false,
    isMissedAlertOn: true,
    updatedAt: "2026-04-07T10:00:00",
  },

  notifications: {
    content: [
      {
        notificationId: 105,
        type: "MEDICATION_REMINDER",
        title: "약 복용 시간입니다",
        message: "암로디핀정 5mg을 복용할 시간이에요",
        isRead: false,
        targetType: "MEDICATION_RECORD",
        targetId: 500,
        createdAt: "2026-04-07T08:50:00",
      },
      {
        notificationId: 104,
        type: "MEDICATION_COMPLETED",
        title: "복약 완료",
        message: "타이레놀정 500mg 복용을 완료했어요",
        isRead: false,
        targetType: "MEDICATION_RECORD",
        targetId: 501,
        createdAt: "2026-04-07T07:00:00",
      },
      {
        notificationId: 103,
        type: "DRUG_INTERACTION_WARNING",
        title: "약물 상호작용 경고",
        message: "새로 스캔한 약물이 복용 중인 약과 상호작용이 있어요",
        isRead: true,
        targetType: "PRESCRIPTION",
        targetId: 10,
        createdAt: "2026-04-06T18:30:00",
      },
      {
        notificationId: 102,
        type: "MEDICATION_REMINDER",
        title: "오늘의 복약 스케줄",
        message: "오늘 복용할 약이 3개 남았어요",
        isRead: true,
        targetType: null,
        targetId: null,
        createdAt: "2026-04-07T08:00:00",
      },
      {
        notificationId: 101,
        type: "REPORT_READY",
        title: "복약 리포트 완성",
        message: "3월 주간 복약 리포트를 확인하세요",
        isRead: true,
        targetType: "REPORT",
        targetId: 202603,
        createdAt: "2026-04-05T10:00:00",
      },
    ],
    page: 0,
    size: 20,
    isLast: true,
  },
};
