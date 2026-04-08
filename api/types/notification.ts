/** PATCH /api/v1/notifications/settings 응답 */
export type NotificationSettings = {
  userId: number;
  isMyReminderOn: boolean;
  isFamilyReminderOn: boolean;
  isMissedAlertOn: boolean;
  updatedAt: string;
};

/** GET /api/v1/notifications content 항목 */
export type NotificationItem = {
  notificationId: number;
  type: string;
  title: string;
  message: string;
  createdAt: string;
};

/** GET /api/v1/notifications 응답 */
export type NotificationListResponse = {
  content: NotificationItem[];
  isLast: boolean;
};
