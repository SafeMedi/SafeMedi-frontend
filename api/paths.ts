/**
 * SAF-26 API 경로. `baseUrl`은 호스트 루트이며, 여기 값은 `/api/v1/...` 로 시작합니다.
 */
export const apiPaths = {
  authLogin: (provider: "kakao" | "naver") => `/api/v1/auth/login/${provider}`,
  usersMeTutorial: "/api/v1/users/me/tutorial",
  usersMe: "/api/v1/users/me",
  usersDeviceToken: "/api/v1/users/device-token",

  familiesRequests: "/api/v1/families/requests",
  familiesRequestsReceived: "/api/v1/families/requests/received",
  familyRequest: (requestId: number | string) => `/api/v1/families/requests/${requestId}`,

  families: "/api/v1/families",
  familiesManage: "/api/v1/families/manage",
  family: (familyId: number | string) => `/api/v1/families/${familyId}`,
  familySettings: (familyId: number | string) => `/api/v1/families/${familyId}/settings`,

  drugsSearch: "/api/v1/drugs/search",

  prescriptions: "/api/v1/prescriptions",
  prescriptionsAnalysis: "/api/v1/prescriptions/analyze",
  prescription: (prescriptionId: number | string) => `/api/v1/prescriptions/${prescriptionId}`,

  medicationRecords: "/api/v1/medications/records",
  medicationRecordsToday: "/api/v1/medication-records/today",
  medicationRecord: (recordId: number | string) => `/api/v1/medication-records/${recordId}`,

  medicationsStatistics: "/api/v1/medications/statistics",

  notifications: "/api/v1/notifications",
  notificationsUnreadCount: "/api/v1/notifications/unread-count",
  notificationsReadAll: "/api/v1/notifications/read-all",
  notificationRead: (notificationId: number | string) =>
    `/api/v1/notifications/${notificationId}/read`,
  notificationsSettings: "/api/v1/notifications/settings",
} as const;
