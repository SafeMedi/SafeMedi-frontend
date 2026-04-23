import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type { FamilySummary, NotificationSettings } from "@/api/types";

export async function fetchFamilies(): Promise<FamilySummary[]> {
  return api.get(apiPaths.families).json<FamilySummary[]>();
}

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  return api.get(apiPaths.notificationsSettings).json<NotificationSettings>();
}

export async function patchNotificationSettings(
  body: Partial<Pick<NotificationSettings, "isMyReminderOn" | "isFamilyReminderOn">>,
): Promise<NotificationSettings> {
  return api.patch(apiPaths.notificationsSettings, { json: body }).json<NotificationSettings>();
}
