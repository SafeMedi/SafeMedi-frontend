export const queryKeys = {
  user: {
    me: ["user", "me"] as const,
  },
  family: {
    manageOverview: ["family", "manage-overview"] as const,
  },
  profile: {
    families: ["profile", "families"] as const,
    notificationSettings: ["profile", "notification-settings"] as const,
  },
} as const;
