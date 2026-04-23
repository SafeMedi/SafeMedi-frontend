export const queryKeys = {
  user: {
    me: ["user", "me"] as const,
  },
  profile: {
    families: ["profile", "families"] as const,
    notificationSettings: ["profile", "notification-settings"] as const,
  },
} as const;
