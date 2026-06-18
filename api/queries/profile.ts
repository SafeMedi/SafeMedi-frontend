import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchFamilies } from "@/api/endpoints/family";
import { fetchNotificationSettings, patchNotificationSettings } from "@/api/endpoints/notification";
import { queryKeys } from "@/api/query-keys";
import type { FamilySummary, NotificationSettings } from "@/api/types";
import { useSessionStore } from "@/stores/sessionStore";
import { useUserStore } from "@/stores/userStore";

const STALE_MS = 5 * 60 * 1000;

/** 프로필 히어로 카드용 데이터 (userStore에서 파생) */
export function useProfileUser() {
  const user = useUserStore((s) => s.user);
  return {
    name: user?.displayName ?? "사용자",
    role: "주 사용자",
  };
}

export function useFamilyProfiles() {
  const accessToken = useSessionStore((s) => s.accessToken);

  return useQuery({
    queryKey: queryKeys.profile.families,
    enabled: !!accessToken,
    staleTime: STALE_MS,
    queryFn: async (): Promise<FamilySummary[]> => fetchFamilies(),
  });
}

/** 건강 정보 (알러지 + 기저질환) — userStore에서 파생 */
export function useHealthInfo() {
  const user = useUserStore((s) => s.user);
  return {
    allergies: user?.allergies ?? [],
    chronicConditions: user?.chronicConditions ?? [],
  };
}

/** 알림 설정 조회 */
export function useNotificationSettings() {
  const accessToken = useSessionStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.profile.notificationSettings,
    enabled: !!accessToken,
    staleTime: STALE_MS,
    queryFn: fetchNotificationSettings,
  });
}

/** 알림 설정 변경 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      body: Partial<Pick<NotificationSettings, "isMyReminderOn" | "isFamilyReminderOn">>,
    ) => patchNotificationSettings(body),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.profile.notificationSettings });

      const previous = queryClient.getQueryData<NotificationSettings>(
        queryKeys.profile.notificationSettings,
      );

      if (previous) {
        queryClient.setQueryData<NotificationSettings>(queryKeys.profile.notificationSettings, {
          ...previous,
          ...patch,
        });
      }

      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.profile.notificationSettings, context.previous);
      }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.profile.notificationSettings, updated);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.notificationSettings });
    },
  });
}
