import type {
  FamilyDetail,
  FamilyManageOverview,
  FamilySummary,
  NotificationListResponse,
  NotificationSettings,
  ReceivedFamilyRequest,
  UserProfile,
} from "@/api/types";

/** mock 전용 플래그·시퀀스 (API 스키마와 무관) */
type MockOnlyState = {
  userDeleted: boolean;
  tutorialCompleted: boolean;
  nextFamilyRequestId: number;
  prescriptionIdSeq: number;
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
  medicationRecordIdSeq: 502,

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
        type: "FAMILY_SUCCESS",
        title: "가족 복약 알림",
        message: "어머니께서 '감기약' 복용을 완료하셨습니다. ✨",
        createdAt: "2026-04-07T09:10:00",
      },
      {
        notificationId: 104,
        type: "MY_MISSED",
        title: "미복용 경고",
        message: "아침 약 복용 시간이 1시간 지났습니다! 지금 바로 드셔주세요. 🚨",
        createdAt: "2026-04-07T09:00:00",
      },
    ],
    isLast: true,
  },
};
