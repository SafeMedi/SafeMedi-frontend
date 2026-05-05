import { useQuery } from "@tanstack/react-query";

import { fetchFamilyDetail, fetchFamilyManageOverview } from "@/api/endpoints/family";
import { queryKeys } from "@/api/query-keys";
import { useSessionStore } from "@/stores/sessionStore";

const STALE_MS = 5 * 60 * 1000;

export function useFamilyManageOverview() {
  const accessToken = useSessionStore((s) => s.accessToken);

  return useQuery({
    queryKey: queryKeys.family.manageOverview,
    enabled: !!accessToken,
    staleTime: STALE_MS,
    queryFn: fetchFamilyManageOverview,
  });
}

export function useFamilyDetail(familyId: number | null) {
  const accessToken = useSessionStore((s) => s.accessToken);

  return useQuery({
    queryKey: queryKeys.family.detail(familyId ?? -1),
    enabled: !!accessToken && familyId !== null,
    staleTime: STALE_MS,
    queryFn: async () => {
      if (familyId === null) {
        throw new Error("가족 ID가 필요합니다.");
      }
      return fetchFamilyDetail(familyId);
    },
  });
}
