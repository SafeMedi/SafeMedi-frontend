export const queryKeys = {
  dashboard: {
    dailyMedicationRecords: (date: string) =>
      ["dashboard", "medication-records", "daily", date] as const,
    monthlyMedicationRecords: (date: string) =>
      ["dashboard", "medication-records", "monthly", date] as const,
    medicationHistoryRecords: (date: string) =>
      ["dashboard", "medication-records", "history", date] as const,
  },
  user: {
    me: ["user", "me"] as const,
  },
  family: {
    manageOverview: ["family", "manage-overview"] as const,
    detail: (familyId: number) => ["family", "detail", familyId] as const,
  },
  profile: {
    families: ["profile", "families"] as const,
    notificationSettings: ["profile", "notification-settings"] as const,
  },
} as const;
