export const queryKeys = {
  dashboard: {
    dailyMedicationRecords: (date: string) =>
      ["dashboard", "medication-records", "daily", date] as const,
    monthlyMedicationRecords: (date: string) =>
      ["dashboard", "medication-records", "monthly", date] as const,
    medicationHistoryRecords: (date: string) =>
      ["dashboard", "medication-records", "history", date] as const,
    medicationStatistics: (startDate: string, endDate: string) =>
      ["dashboard", "medications", "statistics", startDate, endDate] as const,
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
  prescriptions: {
    list: ["prescriptions", "list"] as const,
  },
  scan: {
    createPrescription: ["scan", "prescription", "create"] as const,
    analyzeIngredients: ["scan", "ingredients", "analyze"] as const,
    searchDrugs: (keyword: string) => ["scan", "drugs", "search", keyword] as const,
  },
  map: {
    nearbyFacilities: (
      latitude: number,
      longitude: number,
      category: "all" | "pharmacy" | "emergency",
      keyword: string,
    ) => ["map", "nearby-facilities", latitude, longitude, category, keyword] as const,
  },
} as const;
